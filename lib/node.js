var _ = require('lodash');
var os = require('os');
var request = require('superagent');
var Shared = require('./shared');
var stacktrace = require('stack-trace');

function Client (options) {
  Shared.call(this, options);
}

Client.prototype = Object.create(Shared.prototype);

Client.prototype.getDefaults = function () {
  var sharedDefaults = Shared.prototype.getDefaults.call(this);

  var defaults = {
    entry: {
      details: {
        environment: {
          architecture: os.arch(),
          availablePhysicalMemory: os.freemem(),
          osVersion: os.type() + ' ' + os.platform() + ' ' + os.release(),
          totalPhysicalMemory: os.totalmem(),
        }
      }
    }
  };

  var cpus = os.cpus();

  if (cpus && cpus.length) {
    defaults.entry.details.environment.processorCount = cpus.length;
    defaults.entry.details.environment.cpu = cpus[0].model;
  }

  return _.merge(sharedDefaults, defaults);
};

Client.prototype.getError = function (err) {
  var error = {};
  var stackTrace = null;

  if (!err) {
    err = 'Unknown Error';
  }

  error.message = this._data.entry.details.error.message || err.message;

  if (_.isPlainObject(err)) {
    error.data = err;
    return error;
  }

  if (_.isString(err)) {
    error.data = {error: err};
    error.message = error.message || err;
    return error;
  }

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
  var self = this;

  this.getEntry(function (err, entry) {
    if (err) return console.error(err);
    entry.details.error = self.getError(error);

    request
      .post('https://api.raygun.io/entries')
      .set('X-ApiKey', self._data.apiKey)
      .send(entry)
      .end(function (err, res) {
        if (!callback) return;
        callback(err || res.error);
      });
  });
};

module.exports = function () {
  return new Client();
};
