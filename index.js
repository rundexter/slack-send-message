var rest = require('restler')
  , _    = require('lodash')
;

module.exports = {
    /**
     * This optional function is called every time before the module executes.  It can be safely removed if not needed.
     *
     */
    init: function() {
    }
    /**
     * run
     *
     * @param {WFDataStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {WFDataParser} dexter Container for all data used in this workflow.
     */
    , run: function(step, dexter) {
        var postData = _.merge({
            'icon_emoji': ':ghost:'
         }, step.inputs())
          , url  = step.input('webhook_url')
          , self = this
        ;

        if(!url) return this.fail("Webhook URL is required.");
        if(!postData.text) return this.fail("Text is required.");

        rest.postJson(url, postData).on('complete', function(result, response) {
            if(result instanceof Error) return console.error(result.stack || result);
            if(response.statusCode !== 200) return self.fail({message: 'Error Result From Slack', code: response.statusCode, postData: postData});

            return self.complete(_.merge(_.isObject(result) ? result : { result: result } , postData));
        });
   }
};
