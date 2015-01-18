var _ = require('lodash');
var pkg = require('../package.json');
var request = require('superagent');

function Client (options) {
  if (!options) options = {};
  if (!options.data) options.data = {};
  this._data = _.merge({}, this.getDefaults(), options.data);
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
        response: {},
        request: {},
        tags: [],
        user: {},
        userCustomData: {}
      }
    }
  };
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

module.exports = Client;
