var _ = require('lodash');
var qs = require('qs');
var request = require('superagent');
var Shared = require('./shared');
var tracekit = require('tracekit');
var verge = require('verge');

function Client(options) {
  Shared.call(this, options);
}

Client.prototype = Object.create(Shared.prototype);

Client.prototype.getDefaults = function () {
  var sharedDefaults = Shared.prototype.getDefaults.call(this);
  var queryString = (window.location.search || '?').substring(1);

  var defaults = {
    entry: {
      details: {
        environment: {
          'browser': navigator.appCodeName,
          'browser-height': verge.viewportH(),
          'browser-name': navigator.appName,
          'browser-version': navigator.appVersion,
          'browser-width': verge.viewportW(),
          'color-depth': screen.colorDepth,
          'document-mode': document.documentMode,
          'platform': navigator.platform,
          'screen-width': screen.width,
          'screen-height': screen.height,
          'user-language': navigator.language
        },
        request: {
          headers: {
            'host': document.domain,
            'referer': document.referrer,
            'user-agent': navigator.userAgent
          },
          hostName: window.location.hostname,
          queryString: qs.parse(queryString),
          url: window.location.href
        }
      }
    }
  };

  return _.merge(sharedDefaults, defaults);
};

Client.prototype.getError = function (err) {
  var error = {};
  var stackTrace = null;

  if (!err) {
    err = 'Unknown Error';
  }

  error.message = this._data.entry.details.error.message;

  if (_.isPlainObject(err)) {
    error.data = err;
    return error;
  }

  if (_.isString(err)) {
    error.data = {error: err};
    error.message = error.message || err;
    return error;
  }

  stackTrace = tracekit.computeStackTrace(err);
  error.message = error.message || stackTrace.message;
  error.className = stackTrace.name;
  error.stackTrace = (stackTrace.stack || []).map(function (frame) {
    return {
      className: 'line ' + frame.line + ', column ' + frame.column,
      columnNumber: frame.column,
      fileName: frame.url,
      lineNumber: frame.line,
      methodName: frame.func || '[anonymous]'
    };
  });

  return error;
};

Client.prototype.send = function (error, callback) {
  var self = this;
  callback = callback || function () {};

  if (this._log) console.error(error.stack);
  if (!this._enabled) return callback();

  this.getEntry(function (err, entry) {
    if (err) return callback(err);
    entry.details.error = self.getError(error);

    request
      .post('https://api.raygun.io/entries')
      .query({apikey: self._data.apiKey})
      .send(entry)
      .end(function (err, res) {
        callback(err || res.error);
      });
  });
};

module.exports = function () {
  return new Client();
};
