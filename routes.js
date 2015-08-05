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
    
    // Only allow a call every 13 seconds
    var time_diff = (new Date()).getTime() - app.last_call;
    if (time_diff < 13000) {
      res.end("Server busy...");
      return;
    }
    app.last_call = (new Date()).getTime();

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.last_call = 0;
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
    
    // Only allow a call every 13 seconds
    var time_diff = (new Date()).getTime() - app.last_call;
    if (time_diff < 13000) {
      res.end(JSON.stringify({ result: 'err', error: "Server busy..." }, null, 3));
      return;
    }
    app.last_call = (new Date()).getTime();

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.last_call = 0;
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.body.probID, req.body.problem, req.body.domain, req.body.is_url, path,
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

    if (typeof req.body.plan == 'undefined') {
      res.end(JSON.stringify('Error: No plan to verify', null, 3));
      return;
    }
    
    // Only allow a call every 13 seconds
    var time_diff = (new Date()).getTime() - app.last_call;
    if (time_diff < 13000) {
      res.end(JSON.stringify({ result: 'err', error: "Server busy..." }, null, 3));
      return;
    }
    app.last_call = (new Date()).getTime();

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.last_call = 0;
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.body.probID, req.body.problem, req.body.domain, req.body.is_url, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            var planPath = path + '/plan';
            app.storeFile(req.body.plan, planPath,
            function _planStored(planErr, planRes) {
              if (planErr) {
                cleanupAndRespond(planErr, null);
              } else {
                app.validate(domRes.domainPath, domRes.problemPath, planPath, path, cleanupAndRespond);
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
    
    // Only allow a call every 13 seconds
    var time_diff = (new Date()).getTime() - app.last_call;
    if (time_diff < 13000) {
      res.end(JSON.stringify({ result: 'err', error: "Server busy..." }, null, 3));
      return;
    }
    app.last_call = (new Date()).getTime();

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.last_call = 0;
        var message = error || result;
        res.end(JSON.stringify(message, null, 3))
        cleanupCallback();
      };
      if (dirErr) {
        cleanupAndRespond(dirErr, null);
      } else {
        app.getDomains(req.body.probID, req.body.problem, req.body.domain, req.body.is_url, path,
        function _domainsRetrieved(domErr, domRes) {
          if (domErr) {
            cleanupAndRespond(domErr, null);
          } else {
            app.solve(domRes.domainPath, domRes.problemPath, path,
            function _solved(solveErr, solveRes) {
              if (solveErr) {
                cleanupAndRespond(solveErr, null);
              } else {
                app.validate(domRes.domainPath, domRes.problemPath, solveRes.planPath, path,
                function _validated(valErr, valRes) {
                  if (valErr) {
                    cleanupAndRespond(valErr, null);
                  } else {
                    var response = solveRes;
                    for (var attribute in valRes) {
                        response[attribute] = valRes[attribute];
                    }
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
