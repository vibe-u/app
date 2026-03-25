import { sendMailToRegister } from "./src/config/nodemailer.js";

const test = async () => {
  const testEmail = "akashalopez72@gmail.com"; // 👈 pon tu correo real
  const token = "token_prueba_12345";
  
  console.log("📩 Enviando correo de prueba...");
  await sendMailToRegister(testEmail, token);
};

test();
