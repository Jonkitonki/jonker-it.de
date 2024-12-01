import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from 'dotenv';

config();

const app = express();
app.use(cors());
app.use(express.json());

async function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.post('/api/contact', async (req, res) => {
  let transporter = null;
  
  try {
    const { name, email, message, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    );

    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA Verifizierung fehlgeschlagen' });
    }

    // Create transporter only when needed
    transporter = await createTransporter();

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      subject: `Neue Kontaktanfrage von ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nNachricht:\n${message}`,
      html: `
        <h2>Neue Kontaktanfrage</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Nachricht:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Nachricht' });
  } finally {
    // Close the connection if it was created
    if (transporter) {
      transporter.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});