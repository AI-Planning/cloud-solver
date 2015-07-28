
var express = require("express")
  , bodyParser = require("body-parser")
  , cookieParser = require("cookie-parser")
  , morgan = require("morgan")
  , exec = require('child_process').exec
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

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  });
};


// The magic sauce
app.fetchDomains = function(domainLoc, problemLoc, whendone) {
  var rand = new Date().getTime();
  var newDom = 'testing/domain.' + rand + '.pddl';
  var newProb = 'testing/prob.' + rand + '.pddl';
  var newPlan = 'testing/plan.'+rand+'.ipc';
  var newOut = 'testing/output.' + rand;
  download(domainLoc, newDom, function() {
    download(problemLoc, newProb, function () {
      whendone(null, {'domain':newDom, 'problem':newProb, 'plan':newPlan, 'outfile':newOut});
    });
  });
};

app.readDomains = function(domdata, probdata, whendone) {
  var rand = new Date().getTime();
  var newDom = 'testing/domain.' + rand + '.pddl';
  var newProb = 'testing/prob.' + rand + '.pddl';
  var newPlan = 'testing/plan.'+rand+'.ipc';
  var newOut = 'testing/output.' + rand;
  fs.writeFile(newDom, domdata.split('\\n').join('\n').split('\\t').join('\t'), function() {
    fs.writeFile(newProb, probdata.split('\\n').join('\n').split('\\t').join('\t'), function () {
      whendone(null, {'domain':newDom, 'problem':newProb, 'plan':newPlan, 'outfile':newOut});
    });
  });
}

app.fetchDomainsByID = function(probID, whendone) {
  request({
    url: 'http://api.planning.domains/problem/' + probID,
    json: true
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      app.fetchDomains(body.result.dom_url, body.result.prob_url, whendone);
    } else {
      app.failUnexpected(body, whendone);
    }
  });
}

app.getDomains = function(probID, problem, domain, is_url, whendone) {
  if (typeof probID != 'undefined') {
    app.fetchDomainsByID(probID, whendone);
  } else if ((typeof problem != 'undefined') && (typeof domain != 'undefined')) {
    if(typeof is_url === 'undefined' || is_url === false) {
      app.readDomains(domain, problem, whendone);
    } else {
      app.fetchDomains(domain, problem, whendone);
    }
  } else {
    app.failUnexpected("Must define either domain and problem or probID.", whendone);
  }
}

app.solve = function(dom, prob, plan, outfile, whendone) {
  exec('./plan ' + dom + ' ' + prob + ' ' + plan +
       ' > ' + outfile + ' 2>&1; echo; echo Plan:; cat ' + plan,
       { timeout: 10000 }, function (error, stdout, stderr) {
         app.parsePlan(dom, prob, plan, outfile, whendone);
  });
};

app.parsePlan = function(dom, prob, plan, outfile, whendone) {
  exec('python process_solution.py ' + dom + ' ' + prob + ' ' + plan + ' ' + outfile,
       { timeout: 5000 }, function (error, stdout, stderr) {
         whendone(error, JSON.parse(stdout));
  });
};

app.validate = function(dom, prob, plan, whendone) {
  exec('./validate -S ' + dom + ' ' + prob + ' ' + plan,
    { timeout: 10000 }, function (error, stdout, stderr) {
      if (error) {
        app.failValidate(dom, prob, plan, whendone)
      } else if (stderr) {
        app.failUnexpected("Validator wrote to stderr but did not report an error: " + stderr, whendone);
      } else if (isNaN(stdout.trim())) {
        app.failUnnexpected("Validator output does not look as expected. stdout: " + stdout, whendone)
      } else {
        app.succeedValidate(parseInt(stdout.trim()), whendone);
      }
  });
};

app.failValidate = function(dom, prob, plan, whendone) {
  exec('./validate -e ' + dom + ' ' + prob + ' ' + plan, { timeout: 10000 },
    function (error, stdout, stderr) {
      var response = JSON.stringify({
        'result': 'err',
        'error': 'Plan is invalid.',
        'val_stdout': stdout,
        'val_stderr': stderr
      }, null, 3);
      whendone(error, response);
    }
  );
}

app.failUnexpected = function(message, whendone) {
  var response = JSON.stringify({'result': 'err', 'error': message}, null, 3);
  whendone(null, response);
}

app.succeedValidate = function(cost, whendone) {
  var response = JSON.stringify({'result': 'valid', 'error': false, 'cost': cost}, null, 3);
  whendone(null, response);
}

app.cleanUp = function(filenames, whendone) {
  exec('rm -f ' + filenames.join(" "),
    function (err, stdout, stderr) {
      whendone(err, {'rm_stdout':stdout, 'rm_stderr':stderr});
    }
  );
}


app.set('view engine', 'ejs'); // set up ejs for templating

// set up our express application
app.use(morgan('dev')); // log every request to the console

// routes ======================================================================
require('./routes.js')(app); // load our routes and pass in our app

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
