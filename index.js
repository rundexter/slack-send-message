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
          , accessToken = step.input('access_token').first() ||  botToken || provider.credentials('access_token')
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
        var channels    = step.input('channel')
          , attachments = step.input( 'attachments')
          , texts       = step.input('text')
          , provider    = dexter.provider('slack')
          , botToken    = provider.data('bot.bot_access_token')
          , accessToken =  botToken || provider.credentials('access_token')
          , username    = this.state.username//step.input('username').first()
          , isBot       = !username && !!botToken //operate as the bot if we don't have a different username and we have a bot token
          , asUser      = step.input('as_user')
          , url         = 'https://slack.com/api/chat.postMessage'
          , connections = []
          , self        = this
          , postData    = {
              icon_emoji  : step.input('icon_emoji').first()
              , username  : username
              , token     : accessToken
              , mrkdwn    : true
          }
          , data
        ;

        //use the channels array to dictate how many messages get sent out
        channels.each(function(channel, idx) {
            //grabe the base post data
            data         = _.clone(postData);

            data.channel = channel;

            //use the corresponding text, but fallback to the first entry (null will skip the text field)
            data.text    = texts[idx] !== undefined ? texts[idx] : texts[0];

            if(data.text === undefined) return self.fail("Text is required.");

            //send it as the authed user
            if(asUser.length)
                data.as_user = _.isNil(asUser[idx]) ? asUser[0] : asUser[idx];

            //special case for when the text is "0"
            //slack won't accept it without a leading space
            if(data.text === 0 || data.text === "0") data.text = " 0";


            //if there are attachments handle them
            if(attachments.length) {
                data.attachments  = attachments[idx] !== undefined ? attachments[idx] : attachments[0];
                data.unfurl_links = false;

                /* the attachments "array" actually needs to be a JSON encoded string. Weird. */
                data.attachments = JSON.stringify( data.attachments );
            } else {
                data.unfurl_links = true;
            }

            connections.push(self.send(data, url));
        });
        
        q.all(connections)
          .then(this.complete.bind(this))
          .fail(this.fail.bind(this))
        ;
   }
   , send: function(data, url) {
        var deferred = q.defer()
          , self     = this
        ;

        req.post(url)
          .type('form')
          .send(data)
          .end(function(err, result) {
                return err || !_.get(result,'body.ok')
                  ? deferred.reject({
                    error: err,
                    result: _.get(result,'body')
                  })
                  : deferred.resolve(_.extend(data, result.body))
               ;

          });

        return deferred.promise;
   }
};
