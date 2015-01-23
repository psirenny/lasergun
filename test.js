var test = require('tape');
var lib = require('./lib/node');

function errorFn2() {
  throw new Error('custom error');
}

function errorFn1() {
  errorFn2();
}

test('client', function (t) {
  t.plan(2);
  t.equal(typeof lib, 'function');
  t.equal(typeof lib(), 'object');
});

test('field: apiKey', function (t) {
  var client = lib();
  var val = null;
  t.plan(3);
  t.equal(typeof client.apiKey, 'function');
  val = client.apiKey('secret');
  t.equal(client._data.apiKey, 'secret');
  t.equal(client, val);
});

test('field: data', function (t) {
  var client = lib();
  var val = null;
  t.plan(5);
  t.equal(typeof client.data, 'function');
  val = client.data({foo: 'bar'});
  t.deepEqual(client._data.entry.details.userCustomData, {foo: 'bar'});
  t.equal(client, val);
  val = client.data({baz: 'qux'});
  t.deepEqual(client._data.entry.details.userCustomData, {foo: 'bar', baz: 'qux'});
  t.equal(client, val);
});

test('field: date', function (t) {
  var client = lib();
  var date = new Date();
  var val = null;
  t.plan(5);
  t.equal(typeof client.date, 'function');
  val = client.date(date);
  t.equal(client._data.entry.occurredOn.toString(), date.toString());
  t.equal(client, val);
  date = '01/01/2001';
  val = client.date(date);
  t.equal(client._data.entry.occurredOn.toString(), new Date('01/01/2001').toString());
  t.equal(client, val);
});

test('field: machineName', function (t) {
  var client = lib();
  var val = null;
  t.plan(3);
  t.equal(typeof client.machineName, 'function');
  val = client.machineName('robot');
  t.equal(client._data.entry.details.machineName, 'robot');
  t.equal(client, val);
});

test('field: message', function (t) {
  var client = lib();
  var val = null;
  t.plan(3);
  t.equal(typeof client.message, 'function');
  val = client.message('uh oh');
  t.equal(client._data.entry.details.error.message, 'uh oh');
  t.equal(client, val);
});

test('field: request', function (t) {
  var client = lib();
  var val = null;
  t.plan(9);
  t.equal(typeof client.request, 'function');
  val = client.request({
    body: {},
    headers: {},
    hostname: '',
    method: 'GET',
    ip: '0.0.0.0',
    query: {},
    path: '/'
  });
  t.equal(client, val);
  t.equal(typeof client._data.entry.details.request.form, 'object');
  t.equal(typeof client._data.entry.details.request.headers, 'object');
  t.equal(typeof client._data.entry.details.request.hostName, 'string');
  t.equal(typeof client._data.entry.details.request.httpMethod, 'string');
  t.equal(typeof client._data.entry.details.request.iPAddress, 'string');
  t.equal(typeof client._data.entry.details.request.queryString, 'object');
  t.equal(typeof client._data.entry.details.request.url, 'string');
});

test('field: tag', function (t) {
  var client = lib();
  var val = null;
  t.plan(7);
  t.equal(typeof client.tag, 'function');
  val = client.tag('foo');
  t.deepEqual(client._data.entry.details.tags, ['foo']);
  t.equal(client, val);
  val = client.tag('bar');
  t.deepEqual(client._data.entry.details.tags, ['foo', 'bar']);
  t.equal(client, val);
  val = client.tag('foo');
  t.deepEqual(client._data.entry.details.tags, ['foo', 'bar']);
  t.equal(client, val);
});

test('field: tags', function (t) {
  var client = lib();
  var val = null;
  t.plan(5);
  t.equal(typeof client.tag, 'function');
  val = client.tags(['foo']);
  t.deepEqual(client._data.entry.details.tags, ['foo']);
  t.equal(client, val);
  val = client.tags(['foo', 'bar']);
  t.deepEqual(client._data.entry.details.tags, ['foo', 'bar']);
  t.equal(client, val);
});

test('field: user', function (t) {
  var client = lib();
  var val = null;
  var user = 'id';
  t.plan(7);
  t.equal(typeof client.user, 'function');
  val = client.user(user);
  t.deepEqual(client._data.entry.details.user, {identifier: user});
  t.equal(client, val);
  user = {identifier: 'id'};
  val = client.user(user);
  t.equal(client._data.entry.details.user, user);
  t.equal(client, val);
  user = function () {return {identifier: 'id'};};
  val = client.user(user);
  t.equal(client._data.entry.details.user, user);
  t.equal(client, val);
});

test('field: version', function (t) {
  var client = lib();
  var val = null;
  t.plan(3);
  t.equal(typeof client.version, 'function');
  val = client.version('0.1.0');
  t.equal(client._data.entry.details.version, '0.1.0');
  t.equal(client, val);
});

test('clone', function (t) {
  var client1 = lib();
  var client2 = null;
  t.plan(3);
  t.equal(typeof client1.clone, 'function');
  client1.version('1.0.0');
  client2 = client1.clone();
  t.equal(client1._data.entry.details.version, client2._data.entry.details.version);
  client2.version('1.1.0');
  t.notEqual(client1._data.entry.details.version, client2._data.entry.details.version);
});

test('getEntry', function (t) {
  var client = lib();
  var entry = null;
  t.plan(5);
  client.user(function (cb) {cb(null, {identifier: 'id'});});
  t.equal(typeof client.getEntry, 'function');
  client.getEntry(function (err, entry) {
    t.notOk(err);
    t.equal(typeof entry, 'object');
    t.equal(typeof entry.occurredOn, 'object');
    t.deepEqual(entry.details.user, {identifier: 'id'});
  });
});

test('getError', function (t) {
  var client = lib();
  t.plan(15);
  t.equal(typeof client.getError, 'function');

  try {
    errorFn1(1);
  } catch (err) {
    var error = client.getError(err);
    t.equal(typeof error, 'object');
    t.equal(typeof error.message, 'string');
    t.equal(typeof error.className, 'string');
    t.equal(typeof error.stackTrace, 'object');
    t.ok(error.stackTrace.length);
    t.equal(typeof error.stackTrace[0], 'object');
    t.equal(typeof error.stackTrace[0].className, 'string');
    t.equal(typeof error.stackTrace[0].fileName, 'string');
    t.equal(typeof error.stackTrace[0].lineNumber, 'number');
    t.equal(typeof error.stackTrace[0].methodName, 'string');
    error = client.getError('yikes');
    t.equal(error.message, 'yikes');
    t.deepEqual(error.data, {error: 'yikes'});
    error = client.getError({error: 'whoah'});
    t.deepEqual(error.data, {error: 'whoah'});
    client.message('uh oh');
    error = client.getError(err);
    t.equal(error.message, 'uh oh');
    return;
  }
});

test.skip('send', function (t) {
  var client = lib().tag('ignore');
  t.plan(2);

  try {
    errorFn1();
  } catch(err) {
    client.send(err, t.ok);
    client.apiKey(process.env.RAYGUN_API_KEY);
    client.send(err, t.notOk);
  }
});
