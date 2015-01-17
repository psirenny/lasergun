var _ = require('lodash');
var os = require('os');
var pkg = require('./package.json');
var request = require('superagent');
var stacktrace = require('stack-trace');

function Client (options) {
  if (!options) options = {};
  if (!options.data) options.data = {};

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
          architecture: os.arch(),
          availablePhysicalMemory: os.freemem(),
          osVersion: os.type() + ' ' + os.platform() + ' ' + os.release(),
          totalPhysicalMemory: os.totalmem(),
          utcOffset: new Date().getTimezoneOffset() / -60.0
        },
        error: {},
        machineName: os.hostname(),
        response: {},
        request: {},
        tags: [],
        user: {},
        userCustomData: {}
      }
    }
  };

  var cpus = os.cpus();

  if (cpus && cpus.length) {
    defaults.entry.details.environment.processorCount = cpus.length;
    defaults.entry.details.environment.cpu = cpus[0].model;
  }

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
  this._data.entry.details.request.form = req.body;
  this._data.entry.details.request.headers = req.headers;
  this._data.entry.details.request.hostName = req.hostName;
  this._data.entry.details.request.httpMethod = req.method;
  this._data.entry.details.request.ipAddress = req.ipAddress;
  this._data.entry.details.request.queryString = req.query;
  this._data.entry.details.request.url = req.path;
  return this;
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
  error.message = this._data.entry.details.error.message || err.message || '';
  error.className = err.name;
  error.stackTrace = stacktrace.parse(err).map(function (callSite) {
    return {
      className: callSite.getTypeName() || 'unknown',
      fileName: callSite.getFileName(),
      lineNumber: callSite.getLineNumber(),
      methodName: callSite.getFunctionName() || '[anonymous]'
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
