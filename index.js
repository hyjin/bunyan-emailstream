var util = require('util');
var extend = util._extend;
var stream = require('stream');
var nodemailer = require('nodemailer');

var Stream = stream.Writable || stream.Stream;

// Levels
var LEVELS = {
    10: 'TRACE',
    20: 'DEBUG',
    30: 'INFO',
    40: 'WARN',
    50: 'ERROR',
    60: 'FATAL',
};

/**
 * Convert level integer to level name string
 */
function levelName(level) {
    return LEVELS[level] || 'LVL' + level;
}

exports.EmailStream = EmailStream;
exports.formatSubject = formatSubject;
exports.formatBody = formatBody;

function EmailStream(mailOptions, transporter) {
    Stream.call(this);
    this.writable = true;

    this._mailOptions = extend({}, mailOptions);
    this._transport = nodemailer.createTransport(transporter);

    this._bodyType = mailOptions.bodyType || 'text';
    delete mailOptions.bodyType;

    this.formatSubject = exports.formatSubject;
    this.formatBody = exports.formatBody;
}

util.inherits(EmailStream, Stream);

EmailStream.prototype.write = function (log) {
    var self = this;
    var message = extend({}, this._mailOptions);

    if (! message.subject) {
        message.subject = this.formatSubject(log);
    }
    message[this._bodyType] = this.formatBody(log);

    this._transport.sendMail(message, function (err, response) {
        if (err) {
            self.emit('error', err);
        } else {
            self.emit('mailSent', response);
        }
    });
};

EmailStream.prototype.end = function () {
    if (this._transport) {
        this._transport.close();
    }
};

function formatSubject(log) {
    return util.format(
        '[%s] %s/%s on %s',
        levelName(log.level),
        log.name,
        log.pid,
        log.hostname
    );
}

function formatBody(log) {
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
}

