const { ControlInteractionModelGenerator, Logger } = require('ask-sdk-controls');
new ControlInteractionModelGenerator()
    .withInvocationName('fizz buzz')
    .addIntent({ name: 'AMAZON.StopIntent' })
    .addIntent({ name: 'AMAZON.NavigateHomeIntent' })
    .addIntent({ name: 'AMAZON.HelpIntent' })
    .addIntent({ name: 'AMAZON.CancelIntent' })

    // Add a custom intent
    .addIntent({
         name: 'FizzIntent', 
         slots: [
             {
                 name: 'count',
                 type: 'Amazon.Number',
             },
         ],
        samples: [
        '{count}'
    ]})

    // Build and write (be careful, this overwrites your existing model!!!)
    .buildAndWrite('../skill-package/interactionModels/custom/en-US.json');