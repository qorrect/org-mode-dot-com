const {exec} = require('child_process');
const {easyExec} = require('./sysUtils');
const tmp = require('tmp');
const fileUtils = require('./fileUtils');

async function sshKeyScan(host, port = 22) {
  return new Promise((resolve, reject) => {
    exec(`ssh-keyscan -p ${port} -t rsa ${host}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error} ${stderr}`);
        return reject(error.toString());
      }
      resolve(stdout);
    });
  });
}

async function convertToOpenSSH(sshKey) {
  if (sshKey.trim().startsWith('----')) {
    const tmpFile = tmp.fileSync();
    await fileUtils.write(tmpFile.name, sshKey);
    const contents = await easyExec(`ssh-keygen -i -f ${tmpFile.name}`);
    tmpFile.removeCallback();
    return contents;
  }
  else return sshKey;
}

module.exports = {sshKeyScan, convertToOpenSSH};
