'use strict';
const domain = require('domain');
const Raven = require('../../Raven');

module.exports = (options, app) => {
  return function* (next) {
    const wrapDomain = domain.create();
    wrapDomain.enter();
    wrapDomain.add(this.req);
    wrapDomain.add(this.res);
    Raven.getContext().user = this.user;
    yield* next;
    wrapDomain.exit();
  };
};