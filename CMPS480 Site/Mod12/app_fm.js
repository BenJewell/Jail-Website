var forever = require('forever-monitor');

var child = new(forever.Monitor)('app.js', {
    args: ['prod'], // We assume prod mode here because dev mode never calls this file.
    max: 10,
    silent: false,
    options: []
});

child.on('exit', function() {
    console.log('app.js has exited after 10 restarts');
});

child.start();