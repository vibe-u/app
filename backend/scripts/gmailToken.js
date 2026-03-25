import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI = "https://developers.google.com/oauthplayground",
} = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error("Faltan GMAIL_CLIENT_ID o GMAIL_CLIENT_SECRET en .env");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

const scope = "https://www.googleapis.com/auth/gmail.send";
const code = process.argv[2];

if (!code) {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [scope],
  });

  console.log("1) Abre esta URL en tu navegador y autoriza:");
  console.log(url);
  console.log("");
  console.log("2) Copia el code de retorno y ejecuta:");
  console.log("npm run gmail:token -- <CODE>");
  process.exit(0);
}

try {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("GMAIL_REFRESH_TOKEN=", tokens.refresh_token || "");
  console.log("access_token=", tokens.access_token || "");
  if (!tokens.refresh_token) {
    console.warn("No se recibio refresh_token. Revoca permisos y repite con prompt=consent.");
  }
} catch (error) {
  console.error("Error generando token:", error?.response?.data || error.message);
  process.exit(1);
}
