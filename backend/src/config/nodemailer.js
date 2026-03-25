import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const {
  URL_FRONTEND,
  USER_EMAIL,
  GMAIL_SENDER_EMAIL,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_REDIRECT_URI = "https://developers.google.com/oauthplayground",
  SMTP_FROM_NAME = "Vibe-U",
} = process.env;

const senderEmail = GMAIL_SENDER_EMAIL || USER_EMAIL;

const gmailEnabled = Boolean(
  URL_FRONTEND &&
    senderEmail &&
    GMAIL_CLIENT_ID &&
    GMAIL_CLIENT_SECRET &&
    GMAIL_REFRESH_TOKEN
);

let gmailClient = null;
if (gmailEnabled) {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  });

  gmailClient = google.gmail({ version: "v1", auth: oauth2Client });
  console.log("Gmail API lista para enviar correos");
} else {
  console.warn(
    "Gmail API deshabilitada: faltan URL_FRONTEND, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN o sender email"
  );
}

const toBase64Url = (value) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const buildRawMessage = (to, subject, html) => {
  const lines = [
    `From: \"${SMTP_FROM_NAME}\" <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ];

  return toBase64Url(lines.join("\r\n"));
};

const sendMail = async (to, subject, html) => {
  if (!gmailClient) {
    console.warn(`Gmail API deshabilitada, no se envio correo a ${to}`);
    return null;
  }

  try {
    const raw = buildRawMessage(to, subject, html);
    const response = await gmailClient.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    const messageId = response?.data?.id || "sin-id";
    console.log("Email enviado:", messageId);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.error?.message || error.message;
    console.error("Error enviando email:", message);
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
