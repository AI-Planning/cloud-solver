
var express = require("express")
  , bodyParser = require("body-parser")
  , cookieParser = require("cookie-parser")
  , morgan = require("morgan")
  , exec = require('child_process').exec
  , http = require('http')
  , fs = require('fs')
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
            whendone(newDom, newProb, newPlan, newOut);
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
            whendone(newDom, newProb, newPlan, newOut);
        });
    });
}

app.solve = function(dom, prob, plan, outfile, whendone) {
    exec('./plan ' + dom + ' ' + prob + ' ' + plan +
         ' > ' + outfile + ' 2>&1; echo; echo Plan:; cat ' + plan,
         { timeout: 10000 }, function (error, stdout, stderr) {

        app.parsePlan(dom, prob, plan, outfile, function (result) {
			app.cleanUp(dom, prob, plan, outfile, function() {
			    whendone(result);
			});
		});

    });
};

app.parsePlan = function(dom, prob, plan, outfile, whendone) {
    exec('python process_solution.py ' + dom + ' ' + prob + ' ' + plan + ' ' + outfile,
            { timeout: 5000 }, function (error, stdout, stderr) {
        console.log(stdout);
        whendone(stdout);
    });
};

app.cleanUp = function(dom, prob, plan, outfile, whendone) {
    exec('rm -f ' + dom + ' ' + prob + ' ' + plan + ' ' + outfile, whendone);
}


app.set('view engine', 'ejs'); // set up ejs for templating

// set up our express application
app.use(morgan('dev')); // log every request to the console

// routes ======================================================================
require('./routes.js')(app); // load our routes and pass in our app

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
