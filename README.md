CookieStorage
=============

Client side storage implementation which is utilizing document cookies to store serizlized JSON objects. Serizliing and deserializing of JSON is doing with help of native browser JSON implementation.

<h2>How to use:</h2>
<ul>
 <li>use "new CookieStorage(options)" - to initialize an instance of storage, assosiated data will be read automatically. If you want to override default cookie anme and expire parameters - pass "cookieName" and "cookieExpire" to constructor.</li>
 <li>use "this.data" - to work with data you want to store</li>
 <li>use "this.asve()" - to save data</li>
 <li>use "this.reset()" - to clear data and remove related cookie from document</li>
</ul>
