// config/nodemailer.js

import nodemailer from "nodemailer";

import dotenv from "dotenv";

dotenv.config();



const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.USER_EMAIL,

        pass: process.env.USER_PASS

    }

});



const sendMail = async (to, subject, html) => {

    try {

        const info = await transporter.sendMail({

            from: '"Vibe-U 🎓" <noreply@vibeu.com>',

            to,

            subject,

            html

        });

        console.log("📩 Email enviado:", info.messageId);

    } catch (error) {

        console.error("❌ Error enviando email:", error.message);

    }

};



// ------------------------------------------------------

// 🟣 CONFIRMAR CORREO (SIN MODIFICAR TU ESTILO)

// ------------------------------------------------------

export const sendMailToRegister = async (userMail, token) => {

    const urlConfirm = `${process.env.URL_BACKEND}/api/usuarios/confirmar/${token}`;



    const html = `

        <h1>Bienvenido a Vibe-U 🎓</h1>

        <p>Gracias por registrarte. Confirma tu correo haciendo clic en el siguiente enlace:</p>



        <a href="${urlConfirm}" style="background:#7c3aed;color:white;

           padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">

           Confirmar correo

        </a>



        <br/><br/>

        <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>

    `;



    await sendMail(userMail, "Confirma tu cuenta en VIBE-U 💜", html);

};



// ------------------------------------------------------

// 🟣 RECUPERAR CONTRASEÑA (AUMENTADO, NO MODIFICADO)

// ------------------------------------------------------

export const sendMailToRecoveryPassword = async (userMail, token) => {

    const urlRecovery = `${process.env.URL_FRONTEND}/recuperarpassword/${token}`;



    const html = `

        <h1>Vibe-U 💜</h1>

        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>



        <p>Haz clic en el siguiente botón para continuar:</p>



        <a href="${urlRecovery}" style="background:#7c3aed;color:white;

           padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">

           Restablecer contraseña

        </a>



        <br/><br/>

        <p>Si tú no solicitaste este cambio, simplemente ignora este mensaje.</p>

    `;



    await sendMail(userMail, "Restablece tu contraseña 🔒", html);

};



export default sendMail;
