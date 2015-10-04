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

function EmailStream(mailOptions, transportOptions) {
    Stream.call(this);
    this.writable = true;
    this.pendingMail = [];

    this._mailOptions = extend({}, mailOptions);

    this._transportOptions = extend({}, transportOptions);

    this._transportType = this._transportOptions.type &&
        this._transportOptions.type.toUpperCase() ||
        'SENDMAIL';

    delete this._transportOptions.type;

    this._transport = nodemailer.createTransport(this._transportType, this._transportOptions);

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
    message.text = this.formatBody(log);

    this.pendingMail.push(new Promise(function(resolve, reject) {
        self._transport.sendMail(message, function (err, response) {
            if (err) {
                self.emit('error', err);
            } else {
                self.emit('mailSent', response);
            }
            
            resolve();
        });
    }));
};

EmailStream.prototype.end = function (force) {
    var self = this;
    
    if (0 < arguments.length && force) {
        self._transport.close();
    } else if (self._transport) {
        Promise.all(self.pendingMail)
            .then(function() {
                if (self._transport) {
                    self._transport.close();
                }
            })
         ;
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

