const nodemailer = require('nodemailer');

import striptags from "striptags";
import logger from '../../utils/logger';

class MailHelper {
        private transporter:any;
        private user:string;
        private from :string;
    constructor(args:any) {
        this.transporter = this.connection(args);
        this.user = args.user;
        this.from = args.from;
    }
      /**
   * Connection method creates a transporter instance.
   * @param args The arguments object.
   * @returns The transporter instance.
   */
    connection(args: any) {
       return nodemailer.createTransport({
            host: args.host,
            port: args.port,
            secure: args.secure,
            auth: {
              user: args.user,
              pass: args.password
            }
          });
         }
      /**
   * Send mail method sends an email using the transporter.
   * @param sendTo The recipient's email address.
   * @param subjectLine The email subject.
   * @param htmlBody The email HTML body.
   * @param footer The email footer.
   * @param template The email template name (unused, kept for compatibility).
   * @param cc The CC recipients.
   * @returns A promise resolving to true if the email is sent successfully.
   */
    public async sendMail(sendTo:any, subjectLine:any, htmlBody:any, footer:any, template:any, cc = '') {
        try {
            // Build the full HTML with footer
            const fullHtml = `${htmlBody}<br/><hr/><p style="color:#888;font-size:12px;">${footer}</p>`;

            await this.transporter.sendMail({
                from:  this.from,
                to: sendTo,
                cc: cc,
                subject: subjectLine,
                text: striptags(fullHtml),
                html: fullHtml,
            });
            logger.info(`✅ Email sent successfully to ${sendTo}`);
            return true;
        }
        catch (err) {
            logger.error('❌ Error in sendMail', err);
            throw err;
        }
    }
}
export default  MailHelper;
