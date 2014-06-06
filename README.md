CookieStorage
=============

Client side storage implementation which is utilizing document cookies to store serizlized JSON objects. Serizliing and deserializing of JSON is doing with help of native browser JSON implementation.

How to use:

<pre>
// Initialize an instance of storage, related data will be read automatically
var storage = new CookieStorage({
    cookieName: "myCookieName" // cookie name
    , cookieExpire: 20 // cookie expire (days)
});

// work with data you want to store
storage.data = {
    key1: "value1"
    , key2: "value2"
};

// save data
storage.save();

// clear data and remove related cookie from document
storage.reset();
</pre>



OmnitureHelper
=============

Library provides basic method to work with Adobe Omniture Analytics API.

How to use:

<pre>
// initialize an instance of helper
var omni = new OmnitureHelper({
    accountID: "myOmnitureAccountID"
    , onLoad: function() {
        // do once Omniture will be ready

        var self = this;
        $(function() {
            $("input[type=checkbox]").on("change", function(event) {

                // example #1 - track event
                self.trackLink({
                    linkTitle: "Filter_Change"
                    , linkTrackVars: "events"
                    , linkTrackEvents: "event17"
                    , events: "event17"
                });

                // example #2 - track variables
                self.trackLink({
                    linkTitle: "Filter_Change"
                    , linkTrackVars: "eVar74,prop10"
                    , props: (function() {
                        return [
                            { name: "eVar74", value: "SomeValue" }
                            , { name: "prop10", value: "SomeAnotherValue" }
                        ];
                    })()
                });

            });
        });
    }
    , onError: function() {
        // do in case of error
        console.log("OmnitureHelper: error occured");
    }
});
</pre>