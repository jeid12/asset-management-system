import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: process.env.MAIL_FROM || "RTB Asset Management <onboarding@resend.dev>",
    to: email,
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  await resend.emails.send({
    from: process.env.MAIL_FROM || "RTB Asset Management <onboarding@resend.dev>",
    to: email,
    subject: "Welcome to RTB Asset Management System",
    html: `
      <h1>Welcome, ${fullName}!</h1>
      <p>Your account has been successfully created.</p>
      <p>You can now log in and start using the RTB Asset Management System.</p>
    `,
  });
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await resend.emails.send({
    from: process.env.MAIL_FROM || "RTB Asset Management <onboarding@resend.dev>",
    to: email,
    subject: "Your RTB Login OTP",
    html: `
      <h1>Your OTP Code</h1>
      <p>Use the following one-time code to complete your login:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this, please contact support.</p>
    `,
  });
};
