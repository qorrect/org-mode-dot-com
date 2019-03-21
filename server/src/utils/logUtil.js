const log4js = require('log4js');

let logger = null;

log4js.configure(
  {
    appenders: {
      file: {
        type: 'file',
        filename: 'logs/server.log',
        maxLogSize: 50 * 1024 * 1024, // = 10Mb
        numBackups: 5, // keep five backup files
        compress: false, // compress the backups
        encoding: 'utf-8',
        mode: 0o0640
      },
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p]\t%c -%] %m',
        },
      }
    },
    categories: {
      default: {
        appenders: ['file', 'out'], level: 'trace'
      }
    }
  }
);

const loggerFacade = log4js.getLogger('Ymacs');

class LoggerFacade {
  constructor() {
    this.logCount = 0;
  }

  _truncate(str, shouldTruncate = true) {
    if (shouldTruncate && str && str.length > 203) {
      return str.substr(0, 200) + '...';
    }
    else return str;
  }

  info(str, shouldTruncate = true) {
    this.logCount += 1;
    loggerFacade.info(this._truncate(str, shouldTruncate));
  }

  debug(str, shouldTruncate = true) {
    this.logCount += 1;
    loggerFacade.debug(this._truncate(str, shouldTruncate));
  }

  error(str, shouldTruncate = false) {
    this.logCount += 1;
    loggerFacade.error(this._truncate(str, shouldTruncate));
  }

  warn(str, shouldTruncate = false) {
    this.logCount += 1;
    loggerFacade.warn(this._truncate(str, shouldTruncate));
  }
}

if (!logger) {
  logger = new LoggerFacade();
}
module.exports = logger;
