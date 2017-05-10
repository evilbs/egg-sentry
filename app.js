'use strict';

const path = require('path');
const Raven = require('./Raven');
const Transport = require('egg-logger').Transport;
const format = require('util').format;
const eggLogLevelMapping = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error'
}; 

module.exports = app => {
  const config = app.config.sentry;
  if (config.enableBreadcrumb) {
    app.config.coreMiddleware.unshift('sentrymiddleware');
  }

  const enableEnv = ['prod', 'default'];
  process.env.SENTRY_ENVIRONMENT = app.config.env;

  if (config.enable === false && enableEnv.indexOf(app.config.env) !== -1) {
    config.enable = true;
  }

  if (config.enable !== true) {
    return;
  }

  const options = Object.assign({}, config);
  // 不允许用户自定义 tags
  options.tags = {
    appname: app.name,
    node: process.version,
    arch: process.arch,
    platform: process.platform,
    chair: getChairVersion(),
    egg: getEggVersion(),
  };

  Raven.config(config.dsn, options).install();
  class SentryTransport extends Transport {
    log(level, args) {
      let err = args[0];
      if (!(err instanceof Error)) {
        err = format.apply(null, args);
      }

      if (level === 'ERROR') {
        Raven.captureException(err, {
          tags: {
            ErrorName: err.name,
            ErrorCode: err.code,
          },
        });
      } else {
        const sentryLevel = eggLogLevelMapping[level] || 'info';
        Raven.captureBreadcrumb({ message: err, level: sentryLevel });
      }
    }
  }

  app.loggers.errorLogger.set('sentry', new SentryTransport({ level: 'ERROR' }));
  if (config.enableBreadcrumb) {
    app.loggers.logger.set('sentry', new SentryTransport({ level: 'INFO' }));
  }
};

function getChairVersion() {
  try {
    return require(path.join(path.dirname(require.resolve('chair')), 'package.json')).version;
  } catch (_) {
    return '';
  }
}

function getEggVersion() {
  try {
    return require(path.join(path.dirname(require.resolve('@ali/egg')), 'package.json')).version;
  } catch (_) {
    return '';
  }
}
