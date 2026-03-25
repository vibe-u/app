import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { USER_EMAIL, USER_PASS, URL_FRONTEND } = process.env;
const smtpEnabled = Boolean(USER_EMAIL && USER_PASS && URL_FRONTEND);

let transporter = null;
if (smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: USER_EMAIL,
      pass: USER_PASS,
    },
  });
} else {
  console.warn("SMTP deshabilitado: faltan variables USER_EMAIL, USER_PASS o URL_FRONTEND");
}

const sendMail = async (to, subject, html) => {
  if (!transporter) {
    console.warn(`SMTP deshabilitado, no se envio correo a ${to}`);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: USER_EMAIL,
      to,
      subject,
      html,
    });

    console.log("Email enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error enviando email:", error.message);
    return null;
  }
};

const sendMailToRegister = async (userMail, token) => {
  if (!URL_FRONTEND) return null;

  const urlConfirm = `${URL_FRONTEND}/confirmar/${token}`;
  const html = `
    <h1>Bienvenido a Vibe-U</h1>
    <p>Gracias por registrarte. Confirma tu correo:</p>
    <a href="${urlConfirm}">Confirmar correo</a>
    <p>Si no creaste esta cuenta, ignora este mensaje.</p>
  `;

  return sendMail(userMail, "Confirma tu cuenta en Vibe-U", html);
};

const sendMailToRecoveryPassword = async (userMail, token) => {
  if (!URL_FRONTEND) return null;

  const urlRecovery = `${URL_FRONTEND}/recuperarpassword/${token}`;
  const html = `
    <h1>Vibe-U</h1>
    <p>Restablece tu contrasena:</p>
    <a href="${urlRecovery}">Restablecer contrasena</a>
  `;

  return sendMail(userMail, "Recupera tu contrasena en Vibe-U", html);
};

export {
  sendMail,
  sendMailToRegister,
  sendMailToRecoveryPassword,
};
