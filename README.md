CookieStorage
=============

Client side storage implementation which is utilizing document cookies to store serizlized JSON objects. Serizliing and deserializing of JSON is doing with help of native browser JSON implementation.

How to use:
=============
use "new CookieStorage(options)" - to initialize an instance of storage, assosiated data will be read automatically. If you want to override default cookie anme and expire parameters - pass "cookieName" and "cookieExpire" to constructor.
use "this.data" - to work with data you want to store
use "this.asve()" - to save data
use "this.reset()" - to clear data and remove related cookie from document
