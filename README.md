PDDL Solver (in the cloud!)
==========================

This project is the bases for [solver.planning.domains](http://solver.planning.domains/) -- a web service that provides access to an automated planner. Please report any bugs or feature requests you may have on the [[issue list](https://bitbucket.org/planning-tools/solver/issues)] for the project.


Deploying your own solver
-------------------------

This project should get you from zero to having your own hosted planner in the cloud (heroku to be specific) in under 5 minutes (yes, I've timed myself). It could be considerably less if you already have a heroku account and the appropriate software installed. The steps to having things setup and running are as follows:

1. Head over to http://heroku.com and get yourself an account.
2. Install the [[heroku toolbelt](https://toolbelt.heroku.com)] which will allow you to deploy new applications.
3. Login using your credentials from step 1.
4. Clone this project (if you haven't already) and navigate to it: `git clone git@bitbucket.org:planning-tools/solver.git; cd solver`
5. Run `heroku create` from the directory this file exists. Take note of the URL.
6. Run `git push heroku master` to deploy the software.

Et voila! You now have your very own planner-in-the-cloud.


Playing with things
-------------------

You can test things by running `heroku open` and then appending the appropriate URL to solve a problem:

`http://<your project name>.herokuapp.com/solve?domain=http://www.haz.ca/planning-domains/classical/blocks/domain.pddl&problem=http://www.haz.ca/planning-domains/classical/blocks/probBLOCKS-4-1.pddl`

Most of the magic happens in web.js, routes.js, and process_solution.py. For example, the `app.solve` method in web.js is what invokes the planner, and you can modify the command line string used, the timeout, etc. If you want to run some other planner or type of software, `app.parsePlan` is the method that parses the output. It assumes that properly formatted JSON is sent to the standard output, and all you need to do is replace process_solution.py with your own script to parse any custom output of the planner / software.


Caveats
-------
* If you are behind a firewall or proxy, [these instructions](https://devcenter.heroku.com/articles/using-the-cli#using-an-http-proxy) might help with heroku.

Warranty and Guarantees
----------------------
There are none. Have fun, play nice, and feel free to share any cool things you create.