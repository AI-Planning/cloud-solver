
module.exports = function(key) {
	key = key || "_method";
	
	return function expressMethodOverride(req, res, next) {
		req.originalMethod = req.originalMethod || req.method;

		// Query String
		if (req.query && req.query[key]) {
			req.method = req.query[key].toUpperCase();
			delete req.query[key];
		}
		// Post Parameter
		else if (req.body && req.body[key]) {
			req.method = req.body[key].toUpperCase();
			delete req.body[key];
		} 
		// Header X-HTTP-Method-Override
		else if (req.headers['x-http-method-override']) {
			req.method = req.headers['x-http-method-override'].toUpperCase();
		}

		next();
	};
};