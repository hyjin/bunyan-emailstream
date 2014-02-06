var bunyan = require('bunyan');
var EmailStream = require('../').EmailStream;

var emailStream = new EmailStream({
    to: 'me@example.com'
}, { type: 'STUB' });

var myLogger = bunyan.createLogger({
    name: 'SleepBreaker',
    streams: [{
        type: 'raw', // You should use EmailStream with 'raw' type!
        stream: emailStream,
        level: 'fatal',
    }
        // Some other streams you want
    ]
});

myLogger.fatal(new Error('No sweet sleep anymore'), 'Something bad happened');

emailStream.on('mailSent', function (res) {
    console.log(res.message);
});

