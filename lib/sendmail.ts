import nodemailer from "nodemailer";
export async function sendEmail(to: string, subject: string, text: string) {
  //   const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: '"Time4care" <noreply@example.com>',
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
  });

  console.log(`Email sent to ${to}`);
}
