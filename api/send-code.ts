import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBPPD3mUUmMWvaDxvP6uy22bBaSfXd49LI",
  authDomain: "big-agency.firebaseapp.com",
  databaseURL: "https://big-agency-default-rtdb.firebaseio.com",
  projectId: "big-agency"
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(firebaseApp);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const safeEmail = email.replace(/[.#$[\]]/g, '_');
  await set(ref(db, `verificationCodes/${safeEmail}`), { code, expiresAt });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
    return res.json({ success: true, message: "Code generated (check console)", devCode: code });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in 10 minutes.</p>`
    });
    res.json({ success: true, message: "Code sent to email" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}
