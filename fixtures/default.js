var _ = require('lodash')
    , env = require('./env')
    ;

module.exports = _.merge({
    simulation: true
    , instance_id : 'local_test_instance'
    , urls: {
        home : "http://rundexter.com/"
    }
    , instance_state: {
        active_step :  "local_test_step"
    }
    , workflow: {
        "id"            : "local_test_workflow"
        , "title"       : "Local test workflow"
        , "description" : "A fixture workflow used to test a module"
    }
    , steps: {
        local_test_step: {
            id: 'local_test_step'
            , type: 'module'
            //The test runner will change YOUR_MODULE_NAME to the correct module name
            , name: 'YOUR_MODULE_NAME'
            , next: []
        }
    }
    , modules: {
    }
    , data: {
        local_test_step: {
            input: {
                text        : 'Dexter test fixture...success!',
                channel     : '#random'
                //icon_emoji  : ':ghost:'
            }
        }
    }
}, env);
