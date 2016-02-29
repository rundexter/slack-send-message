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
        var channels      = step.input('channel')
            , attachments = step.input( 'attachments' ).first()
            , provider    = dexter.provider('slack')
            , username    = step.input('username').first()
            , botToken    = provider.data('bot.bot_access_token')
            , isBot       = !username && !!botToken //operate as the bot if we don't have a different username and we have a bot token
            , accessToken =  botToken || provider.credentials('access_token')
            , url         = 'https://slack.com/api/chat.postMessage'
            , connections = []
            , self        = this
            , postData      = {
                icon_emoji     : step.input('icon_emoji').first()
                , text         : step.input('text').first()
                , as_user      : isBot
                , username     : username
                , token        : accessToken
                , mrkdwn       : true
            }
            , data
        ;

        self.log([accessToken, provider.data()]);

        if(postData.text === undefined) return this.fail("Text is required.");

        //special case for when the text is "0"
        //slack won't accept it without a leading space
        if(postData.text === 0 || postData.text === "0") postData.text = " 0";

        if ( attachments.length > 0 ) {
            var attach = [ ];
            attachments.forEach( function( item ) {
                var map = { };
                [ 'fallback', 'color', 'pretext', 'author_name', 'author_link', 'author_icon',
                  'title', 'title_link', 'text', 'fields', 'image_url', 'thumb_url' ].forEach( function( field ) {
                      if ( item[ field ] ) map[ field ] = item[ field ];
                   } );

                attach.push( map );
            } );

            /* the attachments "array" actually needs to be a JSON encoded string. Weird. */
            postData.attachments = JSON.stringify( attach );
        }

        if(channels.length > 0) {
            channels.each(function(channel) {
                data = _.clone(postData);
                data.unfurl_links = attachments.length == 0 ? true : false;
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
        .fail(this.fail.bind(this));
   }
   , send: function(data, url) {
        var deferred = q.defer();
        rest.post(url, {data:data}).on('complete', function(result, response) {
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
