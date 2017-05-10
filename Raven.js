const Raven = require('raven');
const utils = Raven.utils;
const domain = require('domain');
const extend = utils.extend;

Raven.getContext = function () {
  if (domain.active) {
    if (!domain.active.sentryContext) {
      domain.active.sentryContext = {};
      utils.consoleAlert('sentry context not found on active domain');
    }
    return domain.active.sentryContext;
  }

  return false;
};

Raven.captureBreadcrumb = function (breadcrumb) {
  // Avoid capturing global-scoped breadcrumbs before instrumentation finishes
  if (!this.installed) return;
  const currCtx = this.getContext();
  if (!currCtx)
    return false;

  breadcrumb = extend({
    timestamp: +new Date() / 1000
  }, breadcrumb);

  if (!currCtx.breadcrumbs) currCtx.breadcrumbs = [];
  currCtx.breadcrumbs.push(breadcrumb);
  if (currCtx.breadcrumbs.length > this.maxBreadcrumbs) {
    currCtx.breadcrumbs.shift();
  }

  this.setContext(currCtx);
};

module.exports = Raven;