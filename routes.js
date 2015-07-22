
// app/routes.js
module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/list', function(req, res) {
    res.render('list.ejs');
  });

  app.get('/solve', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.query.is_url,
      function(error, dom, prob, plan, outfile) {
        var cleanUpAndRespond = function(result) {
          app.cleanUp([dom, prob, plan], function() {
            if (error != null) {
              var jsonResult = JSON.parse(result);
              var toRet = '';
              if (jsonResult['result'] !== 'err') {
                toRet += "Plan Found:\n  ";
                for (var i = 0; i < jsonResult['plan'].length; i++)
                  toRet += "\n  " + jsonResult['plan'][i]['name'];
              } else {
                toRet += "No plan found. Error:\n" + jsonResult['error'];
              }

              toRet += "\n\n\nOutput:\n";
              toRet += jsonResult['output'];

              res.end(toRet);
            } else {
              res.end("Error: " + error);
            }
          })
        };
        app.solve(dom, prob, plan, outfile, cleanUpAndRespond);
      });
  });

  app.post('/solve', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');

    app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.query.is_url,
      function(error, dom, prob, plan, newout) {
        var cleanUpAndRespond = function(result) {
          app.cleanUp([dom, prob, plan], function() {
            if (error != null) {
              res.end(error);
            } else {
              res.end(result);
            }
          })
        };
        app.solve(dom, prob, plan, outfile, cleanUpAndRespond);
      });
  });

  app.post('/validate', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');
    app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.query.is_url,
      function(dom, prob, plan, newout) {
        var cleanUpAndRespond = function(result) {
          app.cleanUp([dom, prob, plan], function() {
            res.end(result);
          })
        };
        app.validate(dom, prob, req.query.plan, cleanUpAndRespond);
      });
  });

};
