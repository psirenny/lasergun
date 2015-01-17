laser gun
==========

A javascript Raygun.io plugin as an alternative to:
- [https://github.com/MindscapeHQ/raygun4node](raygun4node)
- [https://github.com/MindscapeHQ/raygun4js](raygun4js).

Motivation
----------

The raygun4node plugin does not work when browserified.
I found it difficult to handle errors in isomorphic web apps.
Creating a wrapper around raygun4node and raygun4js is hard because each plugin has a different api.

I also wanted the plugin to have a chainable fluent interface.
Passing custom data, tags, etc. in the other plugins was cumbersome.

Installation
------------

    $ npm install lasergun --save

Usage
-----

    var raygun = require('lasergun');

    raygun()
      .version('1.0.0')
      .apiKey(...)
      .data({foo: 'bar'})
      .tags(['baz', 'quz'])
      .message('testing')
      .send(err);
