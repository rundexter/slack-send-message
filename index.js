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
        var postData = {
                icon_emoji: step.input('icon_emoji').first()
                , text: step.input('text').first()
                , username: step.input('username').first()
            }
            , channels = step.input('channel')
            , url  = step.input('webhook_url').first()
            , self = this
        ;

        if(!url) return this.fail("Webhook URL is required.");
        if(!postData.text) return this.fail("Text is required.");
        if(channels.length === 0) return this.fail("Must post to at least one channel");
        if(!postData.icon_emoji) {
            postData.icon_emoji = ':ghost:';
        }

        channels.each(function(channel) {
            var data = _.clone(postData);
            if(!/^[@#]/.test(channel)) {
                channel = '#' + channel;
                console.log('No prefix: assumed', channel);
            }
            data.channel = channel;
            rest.postJson(url, data).on('complete', function(result, response) {
                if(result instanceof Error) {
                    return console.error(result.stack || result);
                }
                if(response.statusCode !== 200) {
                    console.log(result);
                    console.log('----');
                    console.log(Object.keys(response));
                    console.log('----');
                    return self.fail({
                        message: 'Error Result From Slack',
                        code: response.statusCode,
                        postData: postData
                    });
                }
                return self.complete(_.merge(_.isObject(result) ? result : { result: result } , postData));
            });
        });
   }
};
