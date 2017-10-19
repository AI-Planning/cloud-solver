// app/routes.js

var tmp = require('tmp');

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/list', function(req, res) {
    res.render('list.ejs');
  });

  app.get('/test', function(req, res) {
    res.render('test.ejs');
  });

  /*****************************************
   * Uncomment the following for debugging *
   *****************************************/
  /*
  app.get('/startdebug', function(req, res) {
    app.heap = new app.memwatch.HeapDiff();
    res.end("Heap recording started...");
  });

  app.get('/stopdebug', function(req, res) {
    if (!(app.heap))
      res.end("Heap recording not yet started...");
    else {
      var diff = app.heap.end();
      res.end(JSON.stringify(diff, null, 3));
      app.heap = false;
    }
  });

  app.get('/psaux', function(req, res) {
    app.cp.exec('ps aux', { timeout: 5000 }, function (error, stdout, stderr) {
      res.end(stdout);
    });
  });
  */

  app.get('/solve', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    // Only allow one solve at a time
    if (app.check_for_throttle(req)) {
      res.end("Server busy...");
      return;
    } else if (!app.get_lock()) {
      app.server_in_contention();
      res.end("Server busy...");
      return;
    }

    app.server_use(req);

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.release_lock();
        if (error) {
          res.end(app.errorToText(error));
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

    // Only allow one solve at a time
    if (app.check_for_throttle(req)) {
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    } else if (!app.get_lock()) {
      app.server_in_contention();
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    }

    app.server_use(req);

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.release_lock();
        var message = error || result;
        if (error)
          res.end(JSON.stringify({'status':'error', 'result':message}, null, 3));
        else
          res.end(JSON.stringify({'status':'ok', 'result':message}, null, 3));
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
      res.end(JSON.stringify({'status':'error', 'result':'Error: No plan to verify'}, null, 3));
      return;
    }

    // Only allow one solve at a time
    if (app.check_for_throttle(req)) {
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    } else if (!app.get_lock()) {
      app.server_in_contention();
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    }

    app.server_use(req);

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.release_lock();
        var message = error || result;
        if (error)
          res.end(JSON.stringify({'status':'error', 'result':message}, null, 3));
        else
          res.end(JSON.stringify({'status':'ok', 'result':message}, null, 3));
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

    // Only allow one solve at a time
    if (app.check_for_throttle(req)) {
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    } else if (!app.get_lock()) {
      app.server_in_contention();
      res.end(JSON.stringify({ 'status': 'error', 'result': "Server busy..." }, null, 3));
      return;
    }

    app.server_use(req);

    tmp.dir({prefix: 'solver_planning_domains_tmp_', unsafeCleanup: true},
    function _tempDirCreated(dirErr, path, cleanupCallback) {
      var cleanupAndRespond = function(error, result) {
        app.release_lock();
        var message = error || result;
        if (error)
          res.end(JSON.stringify({'status':'error', 'result':message}, null, 3));
        else
          res.end(JSON.stringify({'status':'ok', 'result':message}, null, 3));
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
