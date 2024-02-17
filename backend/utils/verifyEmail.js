import sgMail from "@sendgrid/mail";
import catchAsync from "./catchAsync.js";
import verificationEmail from "./verificationEmail.js";
import dotenv from "dotenv";
dotenv.config();

export default catchAsync(async (options) => {
  sgMail.setApiKey(process.env.SEND_GRID_KEY);

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: verificationEmail(options.name, options.code),
  };

  await sgMail.send(message);
});
