var _ = require('lodash');
var pkg = require('../package.json');

function Client (options) {
  if (!options) options = {};
  if (!options.data) options.data = {};
  this._data = _.merge({}, this.getDefaults(), options.data);
  this._enabled = true;
}

Client.prototype.apiKey = function (key) {
  this._data.apiKey = key;
  return this;
};

Client.prototype.clone = function () {
  return new this.constructor(_.cloneDeep({data: this._data}));
};

Client.prototype.data = function (data) {
  _.merge(this._data.entry.details.userCustomData, data);
  return this;
};

Client.prototype.date = function (date) {
  this._data.entry.occurredOn = new Date(date);
  return this;
};

Client.prototype.enable = function (enabled) {
  if (typeof enabled === 'undefined') enabled = true;
  this._enabled = !!enabled;
  return this;
};

Client.prototype.log = function (log) {
  if (typeof log === 'undefined') log = true;
  this._log = !!log;
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
  this._data.entry.details.request.hostName = req.hostname;
  this._data.entry.details.request.httpMethod = req.method;
  this._data.entry.details.request.iPAddress = req.ip;
  this._data.entry.details.request.queryString = req.query;
  this._data.entry.details.request.url = req.baseUrl + req.path;
  return this;
};

Client.prototype.response = function (res) {
  this._data.entry.details.response.statusCode = res.statusCode;
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

Client.prototype.getDefaults = function () {
  return {
    entry: {
      details: {
        client: {
          name: pkg.name,
          version: pkg.version,
          url: pkg.homepage
        },
        context: {},
        environment: {
          utcOffset: new Date().getTimezoneOffset() / -60.0
        },
        error: {},
        request: {},
        response: {},
        tags: [],
        user: {},
        userCustomData: {}
      }
    }
  };
};

Client.prototype.getEntry = function (callback) {
  var entry = _.clone(this._data.entry, true);

  if (!entry.occurredOn) {
    entry.occurredOn = new Date();
  }

  if (!_.isFunction(entry.details.user)) {
    return callback(null, entry);
  }

  entry.details.user(function (err, user) {
    if (err) callback(err);
    entry.details.user = user;
    callback(null, entry);
  });
};

module.exports = Client;
