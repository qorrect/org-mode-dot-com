const fs = require('fs');


async function append(path, data) {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, data, err => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
}

async function write(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
}

module.exports = {write, append};
