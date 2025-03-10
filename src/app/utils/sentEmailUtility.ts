import nodemailer from 'nodemailer';
import smtpTransporter from 'nodemailer-smtp-transport';
import config from '../../config';

const sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHTML: string,
) => {
  const transporter = nodemailer.createTransport(
    smtpTransporter({
      service: 'Gmail',
      auth: {
        user: config.emailSender.email || process.env.EMAIL,
        pass: config.emailSender.app_pass || process.env.EMAIL_PASSWORD,
      },
    }),
  );

  const mailOption = {
    from: 'Demo Service <no-reply@gmail.com>',
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOption);
};

export default sentEmailUtility;
