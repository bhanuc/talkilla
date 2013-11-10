/* jshint unused:false */
var express  = require('express');
var http     = require('http');
var sessions = require("client-sessions");
var config   = require('./config').config;
var logger   = require('./logger');
var app      = express();

app.use(express.bodyParser());
app.use(express.static(__dirname + "/../static"));
app.use(sessions({
  cookieName: 'talkilla-session',
  requestKey: 'session',
  secret: process.env.SESSION_SECRET || 'random-secret',//In case process.env.SESSION_SECRET is not set , this string is used to hash the sessions .
  duration: 10 * 24 * 60 * 60 * 1000, // 10 days
  cookie: {
    path: '/',
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    // when secure is true, the cookie will only be sent over SSL
    // XXX Temp disabled, as this needs secure/trusted proxy mode enabling
    secure: false//(config.ROOTURL.indexOf("https") === 0) ? true : false
  }
}));
app.use(app.router);

var server = http.createServer(app);

// development settings
app.configure('development', function() {
  app.use('/test', express.static(__dirname + '/../test'));
});

// production settings
app.configure('production', function() {
});

// test settings
app.configure('test', function() {
  app.use('/test', express.static(__dirname + '/../test'));
});

function uncaughtError(err, req, res, next) {
  logger.error({err: err});
  res.send(500);
}
app.use(uncaughtError);

var api = {
  config: function(req, res) {
    res.header('Content-Type', 'application/javascript');
    // This generates a function because importScripts in the worker doesn't
    // allow access to global variables.
    res.send(200, 'function loadConfig() { return ' + JSON.stringify(config) +
                  '; }');
  }
};

app.get('/config.js', api.config);

app.start = function(serverPort, callback) {
  app.set('users', {});

  server.listen(serverPort, callback);
};

app.shutdown = function(callback) {
  server.close(callback);
};

module.exports.app = app;
module.exports.api = api;
module.exports.server = server;
