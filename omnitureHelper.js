;(function() {
    /**
     * OmnitureHelper constructor function
     * @param options Used to override default settings
     */
    var omnitureHelper = function(options) {
        options = options || {};
        options.onLoad = options.onLoad || function() {};
        options.onError = options.onError || function() {};
        options.accountID = options.accountID || "";

        this.accountID = options.accountID;

        // initialize omniture helper
        this._init(options.onLoad, options.onError);
    };

    /**
     * Initialization function - wait for global S object, wait no longer than 6 seconds
     * @param onloadCallback Callback function to be executed once Omniture will be available
     */
    omnitureHelper.prototype._init = function _init(onloadCallback, onErrorCallback) {
        var self = this;

        var attempts = 200;
        (function fnWait() {
            if (window.s) {
                onloadCallback.apply(self);
            }
            else if (attempts--) {
                setTimeout(fnWait, 30);
            }
            else {
                onErrorCallback.apply(self);
            }
        })();
    };

    /**
     * Send request to Omniture server to immediatelly track an event
     * @param options
     * @param options.linkTitle String represents link title to pass to tl() method
     * @param options.linkTrackVars String represents "s.linkTrackVars" object
     * @param options.linkTrackEvents String represents "s.linkTrackEvents" object
     * @param options.events String represents "s.events" object
     * @param options.props Array of objects, represents name of variables and its values [ {name:value},... ] to set before doing call to server.
     */
    omnitureHelper.prototype.trackLink = function trackLink(options) {
        options.linkTitle = options.linkTitle || "";
        options.linkTrackVars = options.linkTrackVars || "";
        options.linkTrackEvents = options.linkTrackEvents || "";
        options.events = options.events || "";
        options.props = options.props || [];

        // configure request
        var sCode = s_gi(this.accountID);
        sCode.linkTrackVars = options.linkTrackVars;
        sCode.linkTrackEvents = options.linkTrackEvents;
        sCode.events = options.events;
        for (var i= 0, len=options.props.length; i<len; i++) {
            var p = options.props[i];
            sCode[p.name] = p.value;
        }
        // send request to Omniture server
        sCode.tl(true, 'o', options.linkTitle);

        // clear values to prevent tracking with next request
        for (var j= 0, len2=options.props.length; j<len2; j++) {
            window.s[options.props[j].name] = "";
        }
    };

    window.OmnitureHelper = omnitureHelper;
})();