Express Method Override
=======================

Override the method of a request based on a the X-HTTP-Method-Override header or custom query/post parameter.

----

Installation

````bash
npm install express-method-override
````

Usage:

````javascript
// Be sure to place after the body parser if you want to accept the method 
// override using a post parameter
app.use(express.bodyParser());

// Accepts a single argument, the name of the method override parameter,
// defaults to "_method"
app.use(require('express-method-override')('method_override_param_name'));
````