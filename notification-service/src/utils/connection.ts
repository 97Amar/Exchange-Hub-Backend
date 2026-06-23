import MailHelper from "../modules/mail/mail.service";

let mail: MailHelper;

const mailCredentials = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  from: process.env.FROM_EMAIL,
  secure: process.env.SECURE || false,
  password: process.env.SMTP_PASSWORD,
};

const InitConnection = async () => {
  mail = new MailHelper(mailCredentials);
};

InitConnection();

export { mail };
