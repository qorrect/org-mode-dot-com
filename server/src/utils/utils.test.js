/* eslint-disable no-console */
const stringUtils = require('../src/utils/stringUtils');
const needsResuming = require('../src/utils/needsResuming');
const assert = require('assert');
const {execInSeries, execInParallel, ensureObject} = require('../src/utils/collectionUtils');
const _ = require('lodash');
const {sleep, executeWithTimeout} = require('../src/utils/sysUtils');
const {sshKeyScan, convertToOpenSSH} = require('../src/utils/sshUtil');

describe('Utility Tests', () => {
  it('Should create a random string of length 8', () => {
    const randomString = stringUtils.randomString();
    assert.equal(randomString.length, 8);
    assert.equal(stringUtils.isNumeric(randomString.substring(0, 3)), true);
    assert.equal(stringUtils.isAlpha(randomString.substring(4)), true);
  });


  it('Should create a password with specs', async () => {
    const password = stringUtils.createPassword();
    assert.equal(password.length, 10);
    // Contains 1 number
    assert([...password].some(c => stringUtils.isNumeric(c)));
    // Contains 1 special character
    assert([...password].some(c => stringUtils.specialChars.indexOf(c) !== -1));
    // Contains one uppercase
    assert([...password].some(c => stringUtils.upperAlphaChars.indexOf(c) !== -1));

  });

  it('Should create an AD password with specs', async () => {
    const password = stringUtils.createADPassword();
    assert.equal(password.length, 19);
    assert(stringUtils.isAlpha(password[0]));
    for (let i = 0; i < password.length - 1; i++) {
      if (password[i] === password[i + 1]) assert(false, ` Should contain no sequential anything but got ${password}`);
    }
  });

  it('Should trim all but not nos', () => {
    const xs = ['  not ', ' empty ', '   no ', 'No'];
    const res = stringUtils.trimAll(xs, false, false);
    assert.equal(res.length, 4);
    res.forEach(x => {
      assert(x.indexOf(' ') === -1);
    });

  });

  it('Should trim all including nos', () => {
    const xs = ['  not ', ' empty ', '   no ', 'No'];
    const res = _.compact(stringUtils.trimAll(xs, false, true));
    assert.equal(res.length, 2);
    res.forEach(x => {
      assert(x.indexOf(' ') === -1);
    });
  });

  it('Should trim left, right, and fifty four ways to sunset', () => {
    const path = stringUtils.trimLeft('/some/path', '/');
    assert.equal(path, 'some/path');
  });
  it('Should exec in series', async () => {
    const start = new Date();
    const arr = [1, 2, 3, 5, 8];
    const res = await execInSeries(arr, (id) => new Promise((resolve) => {
      setTimeout(() => {
        console.log(id);
        resolve(id);
      }, 1000);
    }));
    const seconds = Math.round(((new Date()) - start));

    assert.deepEqual(res, arr);
    assert(seconds > 5000);

  });

  it('Should exec in parallel', async () => {
    const start = new Date();

    const arr = [1, 2, 3, 5, 8];
    const res = await execInParallel(arr, (id) => new Promise((resolve) => {
      setTimeout(() => {
        console.log(id);
        resolve(id);
      }, 1000);
    }));
    const seconds = Math.round(((new Date()) - start));
    assert.deepEqual(res, arr);
    assert(seconds < 2000);

  });

  it('Should ensure starts with', () => {
    const str = '/some_path';
    const str2 = 'another';

    assert.equal(stringUtils.ensureStartsWith(str, '/'), str);
    assert.equal(stringUtils.ensureStartsWith(str2, '/'), '/' + str2);

  });

  it('Should not have a resume', () => {
    assert(_.isEmpty(needsResuming.getTask('BLANK')));
  });

  it('Should upsertWithId a resume', async () => {
    needsResuming.insert('HEY', {user_id: 'the_charlie', password: 'test'});
  });

  it('Should have a usernamne', async () => {
    assert.equal((await needsResuming.getTask('HEY')).user_id, 'the_charlie');
  });

  it('Should have a password', async () => {
    assert.equal((await needsResuming.getTask('HEY')).password, 'test');
  });

  it('Should have a task', async () => {
    assert(!_.isEmpty(await needsResuming.getTask('HEY')));
  });

  it('Should remove the task', async () => {
    await needsResuming.remove('HEY');
  });

  it('Should findById the known host key', async () => {
    const res = await sshKeyScan('sfgext.acxiom.com');
    assert.equal(res, 'sfgext.acxiom.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDSq1m9UVmKK3afNEB41tzxQpLGRjObXjHoppxx6PMVxAL23Rjw6sOlXxuIWD2k2OdIWXFvXYs39tjr8Um7cyaNt0ANfp6b4WRYbkG1LY75G7UmFaZ/AmHMIfuJhW+4ceQkyANe1+fyQJPdpbv6bdo14hHXAgAEYJQJPXFen8rOaw==\n');
  });


  it('Should ensure object', async () => {
    const o = {};
    assert(_.isEqual(ensureObject(o, {yes: true}), {yes: true}));

    const p = {no: true};
    assert(_.isEqual(ensureObject(p, {yes: true}), {no: true}));
  });

  it('Should fail to convert from SSH2 to OpenSSH', async () => {
    try {
      await convertToOpenSSH('---- Should Fail');
      assert(false);
    }
    catch (e) {
      assert(true);
    }

  });

  it('Should convert from SSH2 to OpenSSH', async () => {
    try {
      const newKey = await convertToOpenSSH('---- BEGIN SSH2 PUBLIC KEY ----\n' +
        'Comment: "rsa-key-20160929"\n' +
        'AAAAB3NzaC1yc2EAAAABJQAAAQEA2n/PLx0suVbkkidXtbRmNc5+XeGLtaNeGGjS\n' +
        'pmxqE3WBGiE6uHdv4mvA9wFPWlriBUnRf47Gju0eHVb1QchIPHa5rGU1Pig6i/q7\n' +
        'YvzUM3WJDlLDkh+644YHRjgWzq53eQDITP61Xt/5i4OjXOq3x72TdYftiWj1AqWw\n' +
        'p4Q6VeJBVg/IUo8TUxXQGWjvShfQoudqEgZM4VL9JMy9YTlMR/5F49xYv4+GIZ/s\n' +
        'xA09pypxl39s7wh5ltjVsUSP+XXWbGQl5qMDvMhjez31OgMIbiz+1FvEs9S9WHAX\n' +
        '1C14Ag17hCMymCwHiilVcfwv0rtVRwQvmZaMxoJtRkaLDYARQw==\n' +
        '---- END SSH2 PUBLIC KEY ----');
      assert(newKey.startsWith('ssh-rsa'));
    }
    catch (e) {
      assert(false);
    }
  });
  it('Should sleep', async () => {
    const start = Date.now();
    await sleep(1, 2);
    const end = Date.now();
    assert(end - start > 1000);
  });

  it('It should hit the timeout ', async () => {
    await executeWithTimeout(async () => {
      await sleep(1);
    }, 500).then(() => assert(false)).catch(e => {
      console.log(e.toString());
      assert(true);
    });
  });

  it('Should convert NLs to BRs', async () => {
    const str = stringUtils.nl2br('test\nthis\nthing\n');
    assert(str.includes('<br/>'));
  });

  it('Should dedicate white space', async () => {
    const list = ['Joe Blow'];
    assert.equal(stringUtils.collectionContainsSpaces(list), true);

    const noSpaceList = ['JoeBlow'];
    assert.equal(stringUtils.collectionContainsSpaces(noSpaceList), false);

  });
});
