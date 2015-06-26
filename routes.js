
// app/routes.js
module.exports = function(app) {


	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	app.get('/solve', function(req, res) {
		if ((typeof req.query.problem === 'undefined') || (typeof req.query.domain === 'undefined')) {
			res.setHeader('Content-Type', 'text/plain');
			res.end("Error: Must define domain and problem");
		} else {
			app.fetchDomains(req.query.domain, req.query.problem, function (dom, prob, plan, newout) {
				app.solve(dom, prob, plan, newout, function (result) {
					res.setHeader('Content-Type', 'text/plain');
					var jsonResult = JSON.parse(result);
					var toRet = '';
					if (jsonResult['result'] !== 'err') {
						toRet += "Plan Found:\n  ";
						for (var i = 0; i < jsonResult['plan'].length; i++)
							toRet += "\n  " + jsonResult['plan'][i]['name'];
					} else {
						toRet += "No plan found. Error:\n" + jsonResult['error'];
					}
					
					toRet += "\nOutput:\n";
					toRet += jsonResult['output'];

					res.end(toRet);

				});
			});
		}
	});

	app.post('/solve', function(req, res) {
		res.setHeader('Access-Control-Allow-Origin','*');
		if ((typeof req.body.problem === 'undefined') || (typeof req.body.domain === 'undefined')) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({ result: 'err', error: "Must define domain and problem" }, null, 3));
		} else {
			app.readDomains(req.body.domain, req.body.problem, function (dom, prob, plan, outfile) {
				app.solve(dom, prob, plan, outfile, function (result) {
					res.setHeader('Content-Type', 'application/json');
					res.end(result);
				});
			});
		}
	});
};
