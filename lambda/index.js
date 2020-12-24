
  
// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Amazon Software License
// http://aws.amazon.com/asl/

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
const Alexa = require('ask-sdk');
const AWS = require('aws-sdk');
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter'); // included in ask-sdk
const ddbTableName = '6093b3a5-7d30-47ce-9960-98603e71cef2';
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const languageStrings = {
  'en': require('./languages/en.js'),
}

const LaunchRequest = {
  canHandle(handlerInput) {
    // launch requests as well as any new session, as games are not saved in progress, which makes
    // no one shots a reasonable idea except for help, and the welcome message provides some help.
    return Alexa.isNewSession(handlerInput.requestEnvelope) 
      || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const attributes = await attributesManager.getPersistentAttributes() || {};

    if (Object.keys(attributes).length === 0) {
      attributes.endedSessionCount = 0;
      attributes.gamesPlayed = 0;
      attributes.gameState = 'ENDED';
    }

    attributesManager.setSessionAttributes(attributes);

    const gamesPlayed = attributes.gamesPlayed.toString()
    const speechOutput = requestAttributes.t('LAUNCH_MESSAGE', gamesPlayed);
    const reprompt = requestAttributes.t('CONTINUE_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(reprompt)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('EXIT_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const YesIntent = {
  canHandle(handlerInput) {
    // only start a new game if yes is said when not playing a game.
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return !isCurrentlyPlaying 
      && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.gameState = 'STARTED';
    sessionAttributes.guessNumber = 1;

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('YES_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    // only treat no as an exit when outside a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return !isCurrentlyPlaying 
      && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.endedSessionCount += 1;
    sessionAttributes.gameState = 'ENDED';
    attributesManager.setPersistentAttributes(sessionAttributes);

    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('EXIT_MESSAGE'))
      .getResponse();

  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('CONTINUE_MESSAGE'))
      .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
      .getResponse();
  },
};
const FizzIntent ={
  canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if(sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }
    const targetNum = sessionAttributes.guessNumber;
    let Fizz = (targetNum + 1) % 3 === 0 || (targetNum + 1)% 5 === 0; 
    return isCurrentlyPlaying 
      && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FizzIntent'
      && Fizz;
  },
  async handle(handlerInput){
    const {attributesManager} = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();
    console.log(`Error handled: ${JSON.stringify(handlerInput)}`);
    const guessNum =handlerInput.requestEnvelope.request.intent.slots.fizz.value;
    const targetNum = sessionAttributes.guessNumber;
    let isFizz = (targetNum + 1 )% 3 ;
    console.log(`isFizz:${targetNum+1} is current number and it is ${isFizz}`);
    let responseNum = 0;
    if((targetNum + 1 )% 3 === 0){
      console.log(` GuessNum: ${guessNum}`);
      if(guessNum === 'fizz'){
        sessionAttributes.guessNumber = targetNum + 2; 
        responseNum = targetNum + 2;
        return handlerInput.responseBuilder
        .speak((responseNum).toString())
        .reprompt((responseNum).toString())
        .getResponse();
      }
    sessionAttributes.gamesPlayed += 1;
    sessionAttributes.gameState = 'ENDED';
      sessionAttributes.guessNumber = targetNum + 2; 
      return handlerInput.responseBuilder
      .speak(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
      .reprompt(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
      .getResponse();
    } else if((targetNum + 1) % 5 === 0){
      if(guessNum === 'buzz'){
        responseNum = targetNum+2;
        sessionAttributes.guessNumber = targetNum + 2; 
        return handlerInput.responseBuilder
        .speak((responseNum).toString())
        .reprompt((responseNum).toString())
        .getResponse();
      }
    } else if((targetNum + 1) % 3 === 0 && (targetNum + 1) % 5 === 0){
      if(guessNum ===  'fizz buzz'){
        responseNum = targetNum + 2;
        sessionAttributes.guessNumber = responseNum;
        return handlerInput.responseBuilder
        .speak((responseNum).toString())
        .reprompt((responseNum).toString())
        .getResponse();
      }
    } 
    sessionAttributes.gamesPlayed += 1;
    sessionAttributes.gameState = 'ENDED';
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
      .reprompt(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
      .getResponse();
    
  }
}

const NumberGuessIntent = {
  canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }
    const targetNum = sessionAttributes.guessNumber;
    let Fizz = (targetNum + 1) % 3 === 0 || (targetNum + 1)% 5 === 0; 
    return isCurrentlyPlaying 
      && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NumberGuessIntent'
      && !Fizz;
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    const guessNum = parseInt(Alexa.getSlotValue(handlerInput.requestEnvelope, 'number'), 10);
    const targetNum = sessionAttributes.guessNumber;
    let responseString = '';

    if (guessNum ===  (targetNum + 1)) {
      sessionAttributes.guessNumber = (targetNum + 2) ; 
      if((guessNum + 1)  % 5  === 0 && (guessNum + 1) % 3 === 0){
        responseString = 'Fizz Buzz';
      } else if((guessNum + 1)  % 5 === 0){
        responseString ='Buzz';
      } else if((guessNum + 1)  % 3 === 0){
       responseString = 'Fizz'
      } else{
       responseString = ((guessNum + 1) ).toString();
     }

      return handlerInput.responseBuilder
        .speak(responseString)
        .reprompt(responseString)
        .getResponse();
    } else if (guessNum !== (targetNum + 1)) {
      sessionAttributes.gamesPlayed += 1;
      sessionAttributes.gameState = 'ENDED';
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();
      return handlerInput.responseBuilder
        .speak(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
        .reprompt(requestAttributes.t('EXIT_MESSAGE', targetNum.toString()))
        .getResponse();
    }
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE_DURING_GAME'))
      .reprompt(requestAttributes.t('FALLBACK_REPROMPT_DURING_GAME'))
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_MESSAGE'))
      .reprompt(requestAttributes.t('ERROR_MESSAGE'))
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    // handle fallback intent, yes and no when playing a game
    // for yes and no, will only get here if and not caught by the normal intent handler
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent' 
      || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
      || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState && sessionAttributes.gameState === 'STARTED') {
      // currently playing
      return handlerInput.responseBuilder
        .speak(requestAttributes.t('FALLBACK_MESSAGE_DURING_GAME'))
        .reprompt(requestAttributes.t('FALLBACK_REPROMPT_DURING_GAME'))
        .getResponse();
    }

    // not playing
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE_OUTSIDE_GAME'))
      .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
      .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: Alexa.getLocale(handlerInput.requestEnvelope),
      resources: languageStrings,
    });
    localizationClient.localize = function localize() {
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

const LogRequestInterceptor = {
  process(handlerInput) {
    // Log Request
    console.log("==== REQUEST ======");
    console.log(JSON.stringify(handlerInput.requestEnvelope, null, 2));
  }
}
/**
 * Response Interceptor to log the response made to Alexa
 */
const LogResponseInterceptor = {
  process(handlerInput, response) {
    // Log Response
    console.log("==== RESPONSE ======");
    console.log(JSON.stringify(response, null, 2));
  }
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
.withPersistenceAdapter(
  new ddbAdapter.DynamoDbPersistenceAdapter({
      tableName: ddbTableName,
      createTable: false,
      dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION})
  })
)
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    SessionEndedRequest,
    HelpIntent,
    YesIntent,
    NoIntent,
    FizzIntent,
    NumberGuessIntent,
    FallbackHandler,
    UnhandledIntent,
  )
  
  .addRequestInterceptors(LocalizationInterceptor)
  .addRequestInterceptors(LogRequestInterceptor)
  .addResponseInterceptors(LogResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();

