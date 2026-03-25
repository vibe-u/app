import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    secure: process.env.PORT_MAILTRAP == 465, // true si es Gmail SSL
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    },
});

const mailOptions = {
    from: `"Vibe-U 🎓" <${process.env.USER_MAILTRAP}>`,
    to: process.env.USER_MAILTRAP, // te envías el correo a ti misma
    subject: "📧 Prueba de conexión SMTP desde Vibe-U",
    html: `
        <h2>¡Hola, Kyara!</h2>
        <p>Este es un correo de prueba enviado desde tu backend de <b>Vibe-U</b>.</p>
        <p>Si lo recibes, tu conexión SMTP está funcionando correctamente 🚀</p>
    `,
};

async function enviarCorreo() {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Correo enviado correctamente:", info.messageId);
    } catch (error) {
        console.error("❌ Error al enviar correo:", error.message);
    }
}

enviarCorreo();
