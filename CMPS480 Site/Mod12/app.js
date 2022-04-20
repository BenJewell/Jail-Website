#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./routes');
var debug = require('debug')('good-grades-api:server');
var http = require('http');
var https = require('https');
const fs = require('fs');



/**
 * Get port from environment and store in Express.
 */

var server, port

if (process.argv[2] === "prod") {
  console.log("Running in PRODUCTION mode")
  port = "443"
  var https_options = {
    key: fs.readFileSync("config/ssl/privkey.pem"),
    cert: fs.readFileSync("config/ssl/fullchain.crt"),
  }
  server = https.createServer(https_options, app);

  http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);// redirect port 80 to 443
}
else {
  console.log("Running in DEVELOPMENT mode")
  port = "3000"
  server = http.createServer(app);
}

// var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
