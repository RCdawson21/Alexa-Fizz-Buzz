const { ControlInteractionModelGenerator, Logger } = require('ask-sdk-controls');
new ControlInteractionModelGenerator()
    .withInvocationName('fizzle buzz')
    .addIntent({ name: 'AMAZON.StopIntent' })
    .addIntent({ name: 'AMAZON.NavigateHomeIntent' })
    .addIntent({ name: 'AMAZON.HelpIntent' })
    .addIntent({ name: 'AMAZON.CancelIntent' })
    .addIntent({ name: 'AMAZON.YesIntent'})
    .addIntent({ name: 'AMAZON.FallbackIntent' })
    .addIntent({ name: 'AMAZON.NoIntent'})
    .addIntent({ name: 'NumberGuessIntent',
        samples: [
            "{number}",
            "is it {number}",
            "how about {number}",
            "could be {number}"
            ],
        slots : [{
        "name": "number", "type": "AMAZON.NUMBER"
            }]
         })
    // Build and write (be careful, this overwrites your existing model!!!)
    .buildAndWrite('../skill-package/interactionModels/custom/en-US.json');