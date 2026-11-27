import nodemailer from "nodemailer";
import dotenv from "dotenv";

//Environment Configuration
dotenv.config();

// Create a transporter using the test account
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER!,
        pass: process.env.BREVO_SMTP_KEY!,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

export default transporter;