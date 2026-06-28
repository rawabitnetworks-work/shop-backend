import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (subject: string, html: string) => {
  await resend.emails.send({
    from: 'Rawabit Networks <onboarding@resend.dev>', // free default sender
    to: process.env.MAIL_TO!.split(','),
    subject,
    html,
  });
};