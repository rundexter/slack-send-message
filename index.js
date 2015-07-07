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
        var results = { foo: 'bar' };
        //Call this.complete with the module's output.  If there's an error, call this.fail(message) instead.
        this.complete(results);
    }
};
