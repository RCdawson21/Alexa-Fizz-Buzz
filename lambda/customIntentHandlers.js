const Alexa = require('ask-sdk');

const  FizzIntent = {
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
      const guessNum = handlerInput.requestEnvelope.request.intent.slots.fizz.value;
      const targetNum = sessionAttributes.guessNumber;
  
      let correctResponse = '';
      let responseString ='';
  
      if((targetNum + 2)  % 5  === 0 && (targetNum + 2) % 3 === 0){
        responseString = 'Fizz Buzz';
      } else if((targetNum + 2)  % 5 === 0){
        responseString ='Buzz';
      } else if((targetNum + 2)  % 3 === 0){
       responseString = 'Fizz'
      } else{
       responseString = ((targetNum + 2) ).toString();
     }
     let isCorrect = false;
      if((targetNum + 1) % 3 === 0 && (targetNum + 1) % 5 === 0){
        correctResponse = 'fizz buzz';
        if(guessNum ===  'fizz buzz'){
          isCorrect = true;
        }
      }  else if((targetNum + 1) % 5 === 0){
        correctResponse = 'buzz';
        if(guessNum === 'buzz'){
          isCorrect=true;
        }
      } else if((targetNum + 1 )% 3 === 0){
        correctResponse ='fizz';
        if(guessNum === 'fizz'){
          isCorrect = true;
        }
  
      }
      if(isCorrect){
        sessionAttributes.guessNumber = targetNum + 2; 
          return handlerInput.responseBuilder
          .speak(responseString)
          .reprompt(responseString)
          .getResponse();
      } else {
        sessionAttributes.gameState = 'ENDED';
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        sessionAttributes.guessNumber = targetNum + 2; 
        
        return handlerInput.responseBuilder
        .speak(requestAttributes.t('LOSE_MESSAGE', correctResponse))
        .reprompt(requestAttributes.t('LOSE_MESSAGE', correctResponse))
        .getResponse();
      }
      
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
     
      return isCurrentlyPlaying 
        && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NumberGuessIntent'
      ;
    },
    async handle(handlerInput) {
      const { attributesManager } = handlerInput;
      const requestAttributes = attributesManager.getRequestAttributes();
      const sessionAttributes = attributesManager.getSessionAttributes();
  
      const guessNum = parseInt(Alexa.getSlotValue(handlerInput.requestEnvelope, 'number'), 10);
      const targetNum = sessionAttributes.guessNumber;
      let responseString = '';
       // this handles fizz intent when a number is inputted instead of a string
      if((targetNum + 1) % 3 === 0 || (targetNum + 1) % 5 === 0){
        if((targetNum + 1) % 3 === 0 && (targetNum + 1) % 5 === 0){
          responseString = 'fizz buzz';
        } else if((targetNum + 1) % 3 === 0){
          responseString = 'fizz';
        } else if((targetNum+1) % 5 === 0){
          responseString = 'buzz';
        }
        sessionAttributes.gamesPlayed += 1;
        sessionAttributes.gameState = 'ENDED';
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
      
        return handlerInput.responseBuilder
          .speak(requestAttributes.t('LOSE_MESSAGE', responseString))
          .reprompt(requestAttributes.t('LOSE_MESSAGE', responseString))
          .getResponse();
      }
       
      // NumberGuessIntent logic
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
        sessionAttributes.gameState = 'ENDED';
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
          .speak(requestAttributes.t('LOSE_MESSAGE', (targetNum+1).toString()))
          .reprompt(requestAttributes.t('LOSE_MESSAGE', (targetNum+1).toString()))
          .getResponse();
      }
      
      return handlerInput.responseBuilder
        .speak(requestAttributes.t('FALLBACK_MESSAGE_DURING_GAME'))
        .reprompt(requestAttributes.t('FALLBACK_REPROMPT_DURING_GAME'))
        .getResponse();
    },
  };

module.exports = {
  FizzIntent,
   NumberGuessIntent
  };
