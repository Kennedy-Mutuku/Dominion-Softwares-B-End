const nodemailer = require('nodemailer');

let transporter;

const initMailer = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Nodemailer test account created:', testAccount.user);
  } catch (err) {
    console.error('Failed to create test account:', err);
  }
};

initMailer();

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.warn('Transporter not ready yet, trying to send anyway...');
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"Dominion Softwares" <noreply@dominionsoftwares.com>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
