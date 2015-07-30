// app/routes.js

var tmp = require('tmp');

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/list', function(req, res) {
    res.render('list.ejs');
  });

  app.get('/solve', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        if (error) {
          res.end(app.errorToText(error))
        } else {
          res.end(app.resultToText(result));
        }
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.query.probID, req.query.problem, req.query.domain, true, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            app.solve(domRes.domainPath, domRes.problemPath, path, cleanupAndRespond);
          }
        });
      }
    });
  });

  app.post('/solve', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.body.is_url, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            app.solve(domRes.domainPath, domRes.problemPath, path, cleanupAndRespond);
          }
        });
      }
    });
  });

  app.post('/validate', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.body.is_url, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            var planPath = path + '/plan';
            app.storeFile(planPath, req.body.plan,
            function _planStored(planErr, planRes) {
              if (planErr) {
                cleanupAndRespond(planErr, null);
              } else {
                app.validate(domres.domainPath, domres.problemPath, planPath, path, cleanupAndRespond);
              }
            });
          }
        });
      }
    });
  });

  app.post('/solve-and-validate', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type', 'application/json');

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.query.probID, req.query.problem, req.query.domain, req.body.is_url, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            app.solve(domainPath, problemPath, path,
            function _solved(solveErr, solveRes) {
              if (solveErr) {
                cleanupAndRespond(solveErr, null);
              } else {
                app.validate(domres.domainPath, domres.problemPath, solveRes.planPath, path,
                function _validated(valErr, valRes) {
                  if (valErr) {
                    cleanupAndRespond(valErr, null);
                  } else {
                    var response = solveRes;
                    response.update(valRes);
                    cleanupAndRespond(null, response);
                  }
                });
              }
            });
          }
        });
      }
    });
  });

};
