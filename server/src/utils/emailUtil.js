/* eslint-disable no-process-env */
const nodemailer = require('nodemailer');
const emailConfig = require('config').get('email');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let emailer = null;

class Emailer {

  async email(to, text, subject = 'Your New User Setup') {
    if (emailConfig.fakeRequests) {
      return;
    }

    return new Promise((resolve, reject) => {
      const html = '<p>' + text + '</p>';
      const transporter = nodemailer.createTransport({
        debug: true,
        host: emailConfig.host,
        secureConnection: false,
        port: 25
      });
      const mailOptions = {
        from: emailConfig.from,
        to,
        subject,
        text,
        html
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        }
        else resolve(info);
      });
    });
  }
}

if (!emailer) {
  emailer = new Emailer();
}

module.exports = emailer;
