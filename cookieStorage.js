;(function(JSON) {
    var Helper = {
        /**
         * Private helper method used to save cookie
         * @param name Cookie name
         * @param value Cookie value
         * @param expire Cookie expire days
         */
        setCookie: function _setCookie(name, value, expire) {
            var d = new Date()
                , expires;
            d.setTime(d.getTime() + (expire*24*60*60*1000));
            expires = "expires=" + d.toGMTString();
            document.cookie = name + "=" + value + "; " + expires;
        }

        /**
         * Private helper method used to read cookie
         * @param name Cookie name
         * @returns {string} Cookie value
         */
        , getCookie: function(name) {
            var cName = name + "="
                , cArr = document.cookie.split(';');
            for (var i=0; i<cArr.length; i++) {
                var c = cArr[i].trim();
                if (c.indexOf(cName) == 0) {
                    return c.substring(cName.length, c.length);
                }
            }
            return "";
        }
    };


    /**
     * CookieStorage constructor function
     * @param options Used to override default settings
     */
    var cookieStorage = function cookieStorage(options) {
        // fix options object before saving
        options = options || {};
        options.cookieName = options.cookieName || "cookie_storage";
        options.cookieExpire = options.cookieExpire || 365;

        this.options = options;
        this.errors = [];
        this.data = {};

        // initialize storage
        this._init();
    };

    /**
     * Initialization function - trying to read previously saved data from cookie into this.data
     */
    cookieStorage.prototype._init = function _init() {
        var _self = this
            , cookieStr = Helper.getCookie(_self.options.cookieName);

        // cookie is in place
        if (cookieStr != undefined && cookieStr !== "") {
            try{
                // try to read and parse JSON from cookie
                _self.data = JSON.parse(cookieStr);
            } catch(ex) {
                var errorObject = {
                    methodName: "_init"
                    , message: "error while parsing JSON from cookie string"
                    , error: ex
                };
                _self.errors.push(errorObj);
            }
        }
    };

    /**
     * Save current this.data object into cookie
     */
    cookieStorage.prototype.save = function() {
        var serizlizedJson = JSON.stringify(this.data);
        Helper.setCookie(this.options.cookieName, serizlizedJson, this.options.cookieExpire);
    };

    /**
     * Clear current data and errors, and remove associated cookie as well
     */
    cookieStorage.prototype.reset = function() {
        this.errors = [];
        this.data = {};
        Helper.setCookie(this.options.cookieName, "", -1);
    };

    window.CookieStorage = cookieStorage;
})(window.JSON);