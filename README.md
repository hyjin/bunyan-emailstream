bunyan-emailstream
==================

Send email on bunyan log record.

This module is cheap way to send email on
[bunyan](https://github.com/trentm/node-bunyan) log record using
[nodemailer](https://github.com/andris9/Nodemailer).

## Quick Usage Example

Here is a simple example to send 'fatal' level log messages to
`me@example.com` via gmail's SMTP service.

```js
var bunyan = require('bunyan');
var EmailStream = require('bunyan-emailstream').EmailStream;

var emailStream = new EmailStream(
  // Nodemailer mailOptions
  { from: 'fatal@example.com',
    to: 'me@example.com'
  },
  // Nodemailer transporter
  { service: 'gmail',
    auth: {
      user: 'username',
      pass: 'password'
    }
  }
);

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

```

Above will send email like this

```
X-Mailer: Nodemailer (0.6.0; +http://github.com/andris9/nodemailer; stub)
Date: Thu, 06 Feb 2014 09:14:00 GMT
Message-Id: <87f6c7df4f5d8b178e9cc798404d9a@localhost.local>
To: me@example.com
Subject: [FATAL] SleepBreaker/33973 on localhost.local
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable
MIME-Version: 1.0

* name: SleepBreaker
* hostname: localhost.local
* pid: 33973
* time: Thu Feb 06 2014 16:59:12 GMT+0900 (JST)
* msg: Something bad happened
* err.stack: Error: No sweet sleep anymore
    at Object.<anonymous> (/Somewhere/Of/Code/badass.js:19:16)
    ...
    at node.js:902:3
```

## Installation

```
npm install bunyan-emailstream
```

## Usage

Include the module

```js
var EmailStream = require('bunyan-emailstream').EmailStream;
```

Create stream instance

```js
var emailStream = new EmailStream(mailOptions, transporter);
```

Where,
* `mailOptions` is options of composing email message. See
[mailOptions](#mailoptions-required) for more detail.
* `transporter` is one for nodemailer's [avalible transports](https://github.com/andris9/Nodemailer#available-transports).
Refer [transporter](#transporter) section for detailed options.

Pass to bunyan logger as a 'raw' type stream

```js
bunyan.createLogger({
    streams: [{
        type: 'raw', // You should use EmailStream with 'raw' type!
        stream: emailStream,
        level: 'fatal', // I bet you don't want to set 'debug' level
    }
);
```

Email will be sent on log level you set.
Below is an example of setting sending email on uncaught exception.

```js
process.on('uncaughtException', function (err) {
    logger.fatal(err, 'Something bas happened');
    process.exit(1);
});
```
### Configuration
#### mailOptions (required)

mailOptions will be passed to `nodemail.transport.sendMail()` when log
record comes via `EmailStream#write`.
You may need to specify body type in the `mailOptions`.

* **bodyType**: _(optional)_ sets how email was rendered on client. One of `'text'` or `'html'`. Default is `'text'`.
`bodyType` property will be extracted from the object and used as property name of email body.

See [nodemailer document](https://github.com/andris9/Nodemailer#e-mail-message-fields)
for full list of options.

#### transporter

`transporter` is argument for `modemailer.createTransport()`, one for nodemailer's
[avalible transports](https://github.com/andris9/Nodemailer#available-transports),
or plain object (creates SMTP transport). When omitted SMTP direct transport will be used by default.

See [nodemailer document](https://github.com/andris9/Nodemailer#setting-up)
for available transports and full list of options.

### Events

#### Event: `mailSent`

This event will be emitted on callback of
`nodemailer.transport.sendMail()`. The arguments passed to event listeners
are identical to `responseStatus` object described at [nodemailer
document](https://github.com/andris9/Nodemailer/blob/master/README.md#return-callback)

#### Event: `error`

In addition to any possible case of stream's error event, the `error`
event will be emitted when `nodemailer.transport.sendMail` callback with error.

### Message Customization

#### Formatting body

`EmailStream#formatBody` will be called in order to format body
text. You may set custom formatter on module's exported `formatBody` or
instance's method `formatBody`.

You can set your own formatter like this:

```js
// Setting custom formatter on EmailStream instance.
emailStream.formatBody = function (log) {
    // log is bunyan log record object

    var rows = [];
    rows.push('* name: ' + log.name);
    rows.push('* hostname: ' + log.hostname);
    rows.push('* pid: ' + log.pid);
    rows.push('* time: ' + log.time);

    if (log.msg) {
        rows.push('* msg: ' + log.msg);
    }

    if (log.err) {
        rows.push('* err.stack: ' + log.err.stack);
    }

    return rows.join('\n');
});
```

#### Formatting subject

Just like formatting body `EmailStream#formatSubject` will be
called in order to format subject text.

You can set your own formatter like this:

```js
// Setting custom formatter on EmailStream instance.
emailStream.formatSubject = function (log) {
    // log is bunyan log record object

    return util.format(
        '[%s] %s/%s on %s',
        levelName(log.level),
        log.name,
        log.pid,
        log.hostname
    );
});
```

## Any questions about this module?

* Source code will explain much more.
* Create some issue to poke me.

## License

[MIT license](https://github.com/hyjin/bunyan-emailstream/blob/master/LICENSE).

