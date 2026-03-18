import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, get, remove } from "firebase/database";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyBPPD3mUUmMWvaDxvP6uy22bBaSfXd49LI",
  authDomain: "big-agency.firebaseapp.com",
  databaseURL: "https://big-agency-default-rtdb.firebaseio.com",
  projectId: "big-agency"
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure Nodemailer for Brevo (Sendinblue)
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-brevo-email@example.com',
      pass: process.env.SMTP_PASS || 'your-brevo-smtp-key'
    }
  });

  app.post("/api/send-code", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in Firebase
    const safeEmail = email.replace(/[.#$[\]]/g, '_');
    await set(ref(db, `verificationCodes/${safeEmail}`), { code, expiresAt });

    // If SMTP credentials are not set, return the code for development purposes
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
      return res.json({ success: true, message: "Code generated (check console)", devCode: code });
    }

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
  });

  app.post("/api/verify-code", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const safeEmail = email.replace(/[.#$[\]]/g, '_');
    const codeRef = ref(db, `verificationCodes/${safeEmail}`);
    const snapshot = await get(codeRef);
    
    if (!snapshot.exists()) {
      return res.status(400).json({ error: "No code requested for this email" });
    }

    const record = snapshot.val();

    if (Date.now() > record.expiresAt) {
      await remove(codeRef);
      return res.status(400).json({ error: "Code expired" });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Code is valid
    await remove(codeRef);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
