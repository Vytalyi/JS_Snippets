CookieStorage
=============

Client side storage implementation which is utilizing document cookies to store serizlized JSON objects. Serizliing and deserializing of JSON is doing with help of native browser JSON implementation.

How to use:

<pre>
    // Initialize an instance of storage, related data will be read automatically
    // If you want to override default cookie name and expire days parameters - pass "cookieName" and "cookieExpire" to constructor
    var storage = new CookieStorage();
    storage.data = { key1: "value1", key2: "value2" }; // work with data you want to store
    storage.save(); // save data
    storage.reset(); // clear data and remove related cookie from document
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
        }
        , onError: function() {
            // do in case of error
        }
    });
</pre>