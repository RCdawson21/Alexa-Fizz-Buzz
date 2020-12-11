const Alexa = require('ask-sdk-core');
const { InputUtil, ControlHandler, ControlManager, Control, ContainerControl, LiteralContentAct, renderActsInSequence } = require('ask-sdk-controls');

class LiteralContentControl extends Control {
    constructor(literalContent, endSession) {
        super(new.target.name);
        this.literalContent = literalContent;
        this.endSession = endSession;
    }
    handle(input, resultBuilder) {
        if(this.literalContent)
            resultBuilder.addAct(new LiteralContentAct(this, {promptFragment: this.literalContent}));
        if(this.endSession)
            resultBuilder.endSession();
    }
    canTakeInitiative() { return false; }
}

class LauncRequestControl extends LiteralContentControl  {
    canHandle(input) { return InputUtil.isLaunchRequest(input); }
}

class HelloIntentControl extends LiteralContentControl {
    canHandle(input) { return InputUtil.isIntent(input, 'HelloIntent'); }
}

class HelpIntentControl extends LiteralContentControl {
    canHandle(input) { return InputUtil.isIntent(input, 'AMAZON.HelpIntent'); }
}

class StopOrCancelIntentControl extends LiteralContentControl {
    canHandle(input) { return InputUtil.isIntent(input, 'AMAZON.StopIntent') || InputUtil.isIntent(input, 'AMAZON.CancelIntent'); }
}

class SessionEndedRequestControl extends LiteralContentControl {
    canHandle(input) { return InputUtil.isSessionEndedRequest(input); }
}

class IntentReflectorControl extends Control {
    canHandle(input) { return input.request.type === 'IntentRequest'; }
    handle(input, resultBuilder) {
        resultBuilder.addAct(new LiteralContentAct(this, {promptFragment: `You just triggered ${input.request.intent.name}`}));
    }
    canTakeInitiative() { return false; }
}

class HelloControl extends ContainerControl {
    constructor(props) {
        super(props);
        this.addChild(new LauncRequestControl('Welcome, you can say Hello or Help. Which would you like to try?', false))
            .addChild(new HelloIntentControl('Hello World!', true))
            .addChild(new HelpIntentControl('You can say hello to me! How can I help?', false))
            .addChild(new StopOrCancelIntentControl('Goodbye!', true))
            .addChild(new IntentReflectorControl('IntentReflectorControl'))
            .addChild(new SessionEndedRequestControl(null, false));
    }
}

class HelloManager extends ControlManager {
    createControlTree() { return new HelloControl({ id: 'HelloControl' }); }
}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(new ControlHandler(new HelloManager()))
    .lambda();
exports.HelloManager = HelloManager;