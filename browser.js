var _ = require('lodash');
var pkg = require('./package.json');
var qs = require('qs');
var request = require('superagent');
var tracekit = require('tracekit');
var verge = require('verge');

function Client (options) {
  if (!options) options = {};
  if (!options.data) options.data = {};
  var queryString = window.location.search || '?';

  var defaults = {
    entry: {
      details: {
        client: {
          name: pkg.name,
          version: pkg.version,
          url: pkg.homepage
        },
        context: {},
        environment: {
          'browser': navigator.appCodeName,
          'browser-height': verge.viewportH(),
          'Browser-Height': verge.viewportH(),
          'windowBoundsHeight': verge.viewportH(),
          'browser-name': navigator.appName,
          'browser-version': navigator.appVersion,
          'browser-width': verge.viewportW(),
          'color-depth': screen.colorDepth,
          'document-mode': document.documentMode,
          'platform': navigator.platform,
          'screen-width': screen.width,
          'screen-height': screen.height,
          'user-language': navigator.userLanague,
          'utcOffset': new Date().getTimezoneOffset() / -60.0
        },
        error: {},
        response: {},
        request: {
          headers: {
            'host': document.domain,
            'referer': document.referrer,
            'user-agent': navigator.userAgent
          },
          hostName: window.location.hostname,
          queryString: qs.parse(queryString),
          url: window.location.href
        },
        tags: [],
        user: {},
        userCustomData: {}
      }
    }
  };

  this._data = _.merge({}, defaults, options.data);
}

Client.prototype.apiKey = function (key) {
  this._data.apiKey = key;
  return this;
};

Client.prototype.data = function (data) {
  _.merge(this._data.entry.details.userCustomData, data);
  return this;
};

Client.prototype.date = function (date) {
  this._data.entry.occurredOn = new Date(date);
  return this;
};

Client.prototype.machineName = function (name) {
  this._data.entry.details.machineName = name;
  return this;
};

Client.prototype.message = function (message) {
  this._data.entry.details.error.message = message;
  return this;
};

Client.prototype.request = function (req) {
  // do nothing
};

Client.prototype.tag = function (tag) {
  this.tags([tag]);
  return this;
};

Client.prototype.tags = function (tags) {
  this._data.entry.details.tags = _(this._data.entry.details.tags)
    .concat(tags)
    .uniq()
    .value();

  return this;
};

Client.prototype.user = function (user) {
  if (typeof user !== 'function' && typeof user !== 'object') user = {identifier: user};
  this._data.entry.details.user = user;
  return this;
};

Client.prototype.version = function (version) {
  this._data.entry.details.version = version;
  return this;
};

Client.prototype.getEntry = function () {
  var entry = _.clone(this._data.entry, true);

  if (_.isFunction(entry.details.user)) {
    entry.details.user = entry.details.user();
  }

  if (!entry.occurredOn) {
    entry.occurredOn = new Date();
  }

  return entry;
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
    .set('X-ApiKey', this._data.apiKey)
    .send(entry)
    .end(function (err, res) {
      if (!callback) return;
      callback(err || res.error);
    });
};

module.exports = function () {
  return new Client();
};
