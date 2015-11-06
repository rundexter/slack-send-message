var rest = require('restler')
  , _    = require('lodash')
  , q    = require('q')
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
            , connections = []
            , self = this
            , data
        ;

        if(!url) return this.fail("Webhook URL is required.");
        if(!postData.text) return this.fail("Text is required.");
        if(!postData.icon_emoji) {
            postData.icon_emoji = ':ghost:';
        }

        if(channels.length > 0) {
            channels.each(function(channel) {
                data = _.clone(postData);
                data.unfurl_links = true;
                //if(!/^[@#C]/.test(channel)) {
                //    channel = '#' + channel;
                //    console.log('No prefix: assumed', channel);
                //}
                data.channel = channel;
                connections.push(self.send(data, url));
            });
        } else {
            //Assume we'll use the default channel
            connections.push(this.send(data, url));
        }
        q.all(connections).then(function(results) {
            self.complete(results);
        })
        .fail(this.fail);
   }
   , send: function(data, url) {
        var deferred = q.defer();
        rest.postJson(url, data).on('complete', function(result, response) {
            if(result instanceof Error) {
                return deferred.reject(result.stack || result);
            }
            if(response.statusCode !== 200) {
                return deferred.reject({
                    message: 'Error Result From Slack',
                    code: response.statusCode,
                    postData: data 
                });
            }
            return deferred.resolve(_.merge(
                _.isObject(result) ? result : { result: result }
                , data
            ));
        });
        return deferred.promise;
   }
};
