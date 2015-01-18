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
          'user-language': navigator.userLanague,
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
  var stackTrace = tracekit.computeStackTrace(err);
  error.message = this._data.entry.details.error.message || stackTrace.message;
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
  var entry = this.getEntry();
  entry.details.error = this.getError(error);

  request
    .post('https://api.raygun.io/entries')
    .query({apikey: this._data.apiKey})
    .send(entry)
    .end(function (err, res) {
      if (!callback) return;
      callback(err || res.error);
    });
};

module.exports = function () {
  return new Client();
};
