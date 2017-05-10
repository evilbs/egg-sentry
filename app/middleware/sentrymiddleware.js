'use strict';
const domain = require('domain');

module.exports = () => {
  return function* (next) {
    const wrapDomain = domain.create();
    wrapDomain.enter();
    wrapDomain.add(this.req);
    wrapDomain.add(this.res);
    yield* next;
    wrapDomain.exit();
  };
};