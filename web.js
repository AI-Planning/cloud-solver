
var express = require("express")
  , bodyParser = require("body-parser")
  , cookieParser = require("cookie-parser")
  , morgan = require("morgan")
  , cp = require('child_process')
  , http = require('http')
  , fs = require('fs')
  , request = require('request')
  , app = express()
  , port = Number(process.env.PORT || 5000);


app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.status(200).end();
  }
  else {
    next();
  }
});

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());
app.use(cookieParser('I am a banana!'));

// Data structures and functions for throttling
app.last_requests = {};
app.current_caller = "";

app.get_ip = function(req) {
    return req.headers['x-forwarded-for'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress;
};

app.server_use = function(req) {
    // Extract the IP as a marker of who is using the service
    var ip = app.get_ip(req);

    // Mark the current caller
    app.current_caller = ip;
};

app.check_for_throttle = function(req) {
    // Extract the IP as a marker of who is using the service
    var ip = app.get_ip(req);

    // Only throttle if it has been less than 20 seconds since the last contentious
    //  server busy call.
    return (ip in app.last_requests) && ((Date.now() - app.last_requests[ip]) < 20000);
};

app.server_in_contention = function() {
    // Mark the currently running source as having a last request for throttling
    app.last_requests[app.current_caller] = Date.now();
};

// Keep around memwatch and cp for debugging purposes
//app.memwatch = memwatch;
app.cp = cp;

app.lock = false;
app.get_lock = function() {
  if (app.lock)
    return false;
  app.lock = true;
  return true;
};
app.release_lock = function() { app.lock = false; };

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  http.get(url,
  function _handleResponse(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  });
};

app.storeFile = function(content, path, whendone) {
  fs.writeFile(path, content.split('\\n').join('\n').split('\\t').join('\t'),
  function _fileWritten() {
    whendone(null, {'path': path});
  });
};


// The magic sauce
app.fetchDomains = function(domainLoc, problemLoc, path, whendone) {
  var domainPath = path + '/domain.pddl';
  var problemPath = path + '/problem.pddl';
  download(domainLoc, domainPath,
  function _domDownloaded() {
    download(problemLoc, problemPath,
    function _probDownloaded() {
      whendone(null, {'domainPath': domainPath, 'problemPath': problemPath});
    });
  });
};

app.readDomains = function(domdata, probdata, path, whendone) {
  var domainPath = path + '/domain.pddl';
  var problemPath = path + '/problem.pddl';
  app.storeFile(domdata, domainPath,
  function _domStored(domErr, domRes) {
    if (domErr) {
      whendone(domErr, null);
    } else {
      app.storeFile(probdata, problemPath,
      function _probStored(probErr, probRes) {
        if (probErr) {
          whendone(probErr, null);
        } else {
          whendone(null, {'domainPath': domainPath, 'problemPath': problemPath});
        }
      });
    }
  });
};

app.fetchDomainsByID = function(problemID, path, whendone) {
  request({
    url: 'http://api.planning.domains/json/classical/problem/' + problemID,
    json: true
  },
  function _handleResponse(error, response, body) {
    if (error) {
      whendone(error, null);
    } else if (response.statusCode != 200) {
      whendone(body, null);
    } else {
      app.fetchDomains(body.result.domain_url, body.result.problem_url, path, whendone);
    }
  });
};

app.getDomains = function(problemID, problem, domain, is_url, path, whendone) {
  if (typeof problemID != 'undefined') {
    app.fetchDomainsByID(problemID, path, whendone);
  } else if ((typeof problem != 'undefined') && (typeof domain != 'undefined')) {
    if(typeof is_url === 'undefined' || is_url === false) {
      app.readDomains(domain, problem, path, whendone);
    } else {
      app.fetchDomains(domain, problem, path, whendone);
    }
  } else {
    whendone("Must define either domain and problem or probID.", null);
  }
};

app.solve = function(domainPath, problemPath, cwd, whendone) {
  var planPath = cwd + '/plan';
  var logPath = cwd + '/log';
  var addPathsAndRespond = function(error, result) {
    if (result) {
      result['planPath'] = planPath;
      result['logPath'] = logPath;
    }
    whendone(error, result);
  };
  cp.exec(__dirname + '/plan ' + domainPath + ' ' + problemPath + ' ' + planPath
       + ' > ' + logPath + ' 2>&1; '
       + 'if [ -f ' + planPath + ' ]; then echo; echo Plan:; cat ' + planPath + '; fi',
       { cwd: cwd },
  function _processStopped(error, stdout, stderr) {
    if (error)
      whendone(error, null);
    else
      app.parsePlan(domainPath, problemPath, planPath, logPath, cwd, addPathsAndRespond);
  });
};

app.parsePlan = function(domainPath, problemPath, planPath, logPath, cwd, whendone) {
  cp.exec('timeout 5 python ' + __dirname + '/process_solution.py '
       + domainPath + ' ' + problemPath + ' ' + planPath + ' ' + logPath,
       { cwd: cwd },
  function _processStopped(error, stdout, stderr) {
    if (error)
      whendone(error, null);
    var result = JSON.parse(stdout);
    if (result.parse_status === 'err')
      whendone(result, null);
    else
      whendone(null, result);
  });
};

app.validate = function(domainPath, problemPath, planPath, cwd, whendone) {
  cp.exec('timeout 5 ' + __dirname + '/validate -S ' + domainPath + ' ' + problemPath + ' ' + planPath,
    { cwd: cwd },
  function _processStopped(error, stdout, stderr) {
    if (error) {
      app.failValidate(domainPath, problemPath, planPath, cwd, whendone);
    } else if (stderr) {
      whendone({
        'val_status': 'err',
        'error':'Validator wrote to stderr but did not report an error.',
        'val_stdout': stdout,
        'val_stderr': stderr
      }, null);
    } else if (isNaN(stdout.trim())) {
      whendone({
        'val_status': 'err',
        'error':'Validator output does not look as expected.',
        'val_stdout': stdout,
        'val_stderr': stderr
      }, null);
    } else {
      var cost = parseInt(stdout.trim(), 10);
      whendone(null, {'val_status': 'valid',
                      'error': false,
                      'val_stdout': stdout,
                      'val_stderr': stderr,
                      'cost': cost});
    }
  });
};

app.failValidate = function(domainPath, problemPath, planPath, cwd, whendone) {
  cp.exec('timeout 5 ' + __dirname + '/validate -e ' + domainPath + ' ' + problemPath + ' ' + planPath,
    { cwd: cwd },
  function _processStopped(error, stdout, stderr) {
    whendone({
      'val_status': 'err',
      'error': 'Plan is invalid.',
      'val_stdout': stdout,
      'val_stderr': stderr
    }, null);
  });
};

app.errorToText = function(err) {
    return "Error :" + JSON.stringify(err, null, 3);
};

app.resultToText = function(result) {
  var toRet = '';
  if (result['parse_status'] === 'err') {
    toRet += "No plan found. Error:\n" + result['error'];
  } else {
    toRet += "Plan Found:\n  ";
    for (var i = 0; i < result['plan'].length; i++)
      toRet += "\n  " + result['plan'][i]['name'];
  }
  toRet += "\n\n\nOutput:\n";
  toRet += result['output'];
  return toRet;
};

app.set('view engine', 'ejs'); // set up ejs for templating

// set up our express application
app.use(morgan('dev')); // log every request to the console

// routes ======================================================================
require('./routes.js')(app); // load our routes and pass in our app

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
