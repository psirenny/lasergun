laser gun
==========

A javascript Raygun.io plugin as an alternative to [https://github.com/MindscapeHQ/raygun4node](raygun4node) and [https://github.com/MindscapeHQ/raygun4js](raygun4js).

Motivation
----------

The raygun4node plugin does not work when browserified which, makes it difficult to handle errors in isomorphic web apps.
Moreover, creating a wrapper around raygun4node and raygun4js is unnecessarily complicated because each plugin has a different api.

Speaking about apis… I wanted the plugin to have a chainable fluent interface.
Passing custom data, tags, etc. in the other plugins felt cumbersome.

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
