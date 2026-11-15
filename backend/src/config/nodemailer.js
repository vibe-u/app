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
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const lines = [
    `From: \"${SMTP_FROM_NAME}\" <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
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

const buildActionEmail = ({ preheader, title, message, actionLabel, actionUrl, note }) => `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f1f8;font-family:Arial,Helvetica,sans-serif;color:#252334;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f1f8;padding:32px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="padding:24px 32px;background-color:#6c0063;background-image:linear-gradient(110deg,#6c0063,#d6006d);color:#ffffff;">
                  <div style="font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Vibe-U</div>
                  <div style="margin-top:5px;font-size:13px;color:#fce7f3;">Conecta con tu vida universitaria</div>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 32px 28px;">
                  <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#252334;">${title}</h1>
                  <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#555365;">${message}</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                    <tr>
                      <td align="center" style="border-radius:10px;background-color:#8b2f86;">
                        <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:10px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">${actionLabel}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#666477;">${note}</p>
                  <p style="margin:20px 0 8px;font-size:12px;line-height:1.5;color:#777486;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                  <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;"><a href="${actionUrl}" style="color:#7a2876;">${actionUrl}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;background:#faf9fc;border-top:1px solid #eeeaf2;font-size:12px;line-height:1.6;color:#777486;">
                  Este mensaje fue enviado por Vibe-U. Si no realizaste esta solicitud, puedes ignorarlo.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const sendMailToRegister = async (userMail, token) => {
  if (!URL_FRONTEND) return null;

  const urlConfirm = `${URL_FRONTEND}/confirmar/${token}`;
  const html = buildActionEmail({
    preheader: "Confirma tu correo institucional para activar tu cuenta de Vibe-U.",
    title: "¡Te damos la bienvenida a Vibe-U!",
    message: "Gracias por crear tu cuenta. Confirma tu correo institucional para completar el registro y empezar a conectar con tu comunidad universitaria.",
    actionLabel: "Confirmar mi correo",
    actionUrl: urlConfirm,
    note: "Este enlace confirma que tienes acceso a este correo y permite activar tu cuenta.",
  });

  return sendMail(userMail, "Confirma tu correo y únete a Vibe-U", html);
};

const sendMailToRecoveryPassword = async (userMail, token) => {
  if (!URL_FRONTEND) return null;

  const urlRecovery = `${URL_FRONTEND}/recuperarpassword/${token}`;
  const html = buildActionEmail({
    preheader: "Sigue el enlace seguro para crear una nueva contraseña de Vibe-U.",
    title: "Restablece tu contraseña",
    message: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. Usa el botón para elegir una nueva y recuperar el acceso.",
    actionLabel: "Crear nueva contraseña",
    actionUrl: urlRecovery,
    note: "Por seguridad, este enlace caduca en 15 minutos. Si no solicitaste el cambio, ignora este correo; tu contraseña actual seguirá igual.",
  });

  return sendMail(userMail, "Restablece tu contraseña de Vibe-U", html);
};

export {
  sendMail,
  sendMailToRegister,
  sendMailToRecoveryPassword,
};
