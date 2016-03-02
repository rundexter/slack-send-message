var req  = require('superagent')
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
    , getUsername: function(step, dexter) {
        var deferred = q.defer()
          , provider    = dexter.provider('slack')
          , botToken    = provider.data('bot.bot_access_token')
          , accessToken =  botToken || provider.credentials('access_token')
          , self        = this
        ;

        this.state.username = step.input('username').first();

        if(!this.state.username && accessToken) {
            req.post('https://slack.com/api/auth.test')
              .type('form')
              .send({ token: accessToken })
              .end(function(err, result) {
                    self.state.username = result.body.user;

                    return err || !result.ok
                      ? deferred.reject(err)
                      : deferred.resolve(result.body.user)
                    ;
              });

        } else {
            return q(this.state);
        }

        return deferred.promise;
    }
    , run: function(step, dexter) {
        this.state = {};

        this.getUsername(step, dexter)
            .then(this.processRequest.bind(this, step, dexter))
            .catch(this.fail.bind(this));
    }
    /**
     * run
     *
     * @param {WFDataStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {WFDataParser} dexter Container for all data used in this workflow.
     */
    , processRequest: function(step, dexter) {
        var channels      = step.input('channel')
            , attachments = step.input( 'attachments').first() || []
            , provider    = dexter.provider('slack')
            , botToken    = provider.data('bot.bot_access_token')
            , accessToken =  botToken || provider.credentials('access_token')
            , username    = this.state.username//step.input('username').first()
            , isBot       = !username && !!botToken //operate as the bot if we don't have a different username and we have a bot token
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

        if(postData.text === undefined) return this.fail("Text is required.");

        //special case for when the text is "0"
        //slack won't accept it without a leading space
        if(postData.text === 0 || postData.text === "0") postData.text = " 0";

        if ( attachments.length > 0 ) {
            var attach = [ ];
            attachments.forEach( function( item ) {
                var map = { };
                [ 'fallback', 'color', 'pretext', 'author_name', 'author_link', 'author_icon',
                  'title', 'title_link', 'text', 'fields', 'image_url', 'thumb_url', 'mrkdwn_in' ].forEach( function( field ) {
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
                data.unfurl_links = attachments.length === 0 ? true : false;
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
        var deferred = q.defer()
          , self     = this
        ;

        req.post('https://slack.com/api/auth.test')
          .type('form')
          .send(data)
          .end(function(err, result) {
                console.log(result.body);
                return err || !result.ok
                  ? deferred.reject({
                    result: result
                  })
                  : deferred.resolve(_.extend(data, result.body))
               ;

          });

        return deferred.promise;
   }
};
