
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
      function(domerr, domres) {
      
        console.log(JSON.stringify(domres, null, 3));

        if (domerr)
          res.end("Error: " + domerr);

        else {
          var cleanUpAndRespond = function(error, result) {
          
            console.log(JSON.stringify(error, null, 3));
            console.log(JSON.stringify(result, null, 3));

            app.cleanUp([domres.domain, domres.problem, domres.plan, domres.outfile], function() {

              var toRet = '';
              if (error || (result['result'] === 'err'))
                toRet += "No plan found. Error:\n" + result['error'];
              else {
                toRet += "Plan Found:\n  ";
                for (var i = 0; i < result['plan'].length; i++)
                  toRet += "\n  " + result['plan'][i]['name'];
              }

              toRet += "\n\n\nOutput:\n";
              toRet += result['output'];

              res.end(toRet);

            });

          };

          app.solve(domres.domain, domres.problem, domres.plan, domres.outfile, cleanUpAndRespond);

        }
      });
  });

  app.post('/solve', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');

    app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.query.is_url,
      function(domerr, domres) {
        var cleanUpAndRespond = function(error, result) {
          app.cleanUp([domres.domain, domres.problem, domres.plan, domres.outfile], function() {
            if (error)
              res.end(error);
            else
              res.end(result);
          });
        };
        app.solve(domres.domain, domres.problem, domres.plan, domres.outfile, cleanUpAndRespond);
      });
  });

  app.post('/validate', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');
    app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.query.is_url,
      function(domerr, domres) {
        var cleanUpAndRespond = function(error, result) {
          app.cleanUp([domres.domain, domres.problem, domres.plan], function() {
            if (error)
              res.end(error);
            else
              res.end(result);
          });
        };
        app.validate(domres.domain, domres.problem, req.query.plan, cleanUpAndRespond);
      });
  });

};
