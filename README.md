CookieStorage
=============

Client side storage implementation which is utilizing document cookies to store serizlized JSON objects.

How to use:
=============
var storage = new CookieStorage({
     cookieName: "my_cookie_storage" // not required parameter
     , cookieExpire: 365 // not required parameter
});
