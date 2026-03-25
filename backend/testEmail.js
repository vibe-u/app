import dotenv from "dotenv";
import { sendMail } from "./src/config/nodemailer.js";

dotenv.config();

const to = process.env.GMAIL_TEST_TO || process.env.GMAIL_SENDER_EMAIL || process.env.USER_EMAIL;

async function enviarCorreo() {
  if (!to) {
    console.error("Falta GMAIL_TEST_TO o USER_EMAIL/GMAIL_SENDER_EMAIL en .env");
    process.exit(1);
  }

  const html = `
    <h2>Hola, Kyara!</h2>
    <p>Este es un correo de prueba enviado con <b>Gmail API</b> desde Vibe-U.</p>
    <p>Si lo recibes, la integracion esta funcionando correctamente.</p>
  `;

  const info = await sendMail(to, "Prueba Gmail API desde Vibe-U", html);
  if (!info) {
    console.error("Error al enviar correo de prueba");
    process.exit(1);
  }

  console.log("Correo de prueba enviado correctamente");
}

enviarCorreo();
