const {msleep} = require('usleep');
const exec = require('child_process').exec;

const TIMEOUT_MSG = 'EXEC_WITH_TIMEOUT_HIT_TIMEOUT';

async function sleep(minInSeconds, maxInSeconds = 0) {
  return msleep((Math.random() * (maxInSeconds * 1000)) + (minInSeconds * 1000));
}

function clone(_) {
  return JSON.parse(JSON.stringify(_));
}

async function easyExec(str) {
  return new Promise((resolve, reject) => {
    exec(str, (error, stdout) => {
      if (error !== null) {
        reject(error);
      }
      else resolve(stdout);
    });
  });
}

/**
 * Throws an exception with the words EXEC_WITH_TIMEOUT_HIT_TIMEOUT if it hits the timeout
 * @param {Function} func - func to execute
 * @param {Integer} timeout - time before throwing an exception
 * @returns {Promise} - reject or resolve it succeeded
 */

async function execWithTimeout(func, timeout = 5000) {
  const msg = '\n\nIn stack  ' + getStackTrace();
  return new Promise((resolve, reject) => {
    console.time('in_exec_with_timeout');
    const interval = setInterval(() => {
      console.timeEnd('in_exec_with_timeout');
      clearInterval(interval);
      reject(new Error(TIMEOUT_MSG + msg));
    }, timeout);
    func().then((...args) => {
      // console.timeEnd('in_exec_with_timeout');
      clearInterval(interval);
      resolve(...args);
    }).catch(e => {
      console.timeEnd('in_exec_with_timeout');
      clearInterval(interval);
      reject(new Error(e.toString() + msg));
    });
  });
}

function getStackTrace() {
  const regExp = /([^(]+)@|at ([^(]+) \(/g;
  const regexMatch = regExp.exec(new Error().stack);
  const lines = regexMatch.input.split('\n');
  return lines.slice(1);
}

module.exports = {
  sleep,
  executeWithTimeout: execWithTimeout,
  clone,
  TIMEOUT_MSG,
  easyExec,
  getStackTrace
};
