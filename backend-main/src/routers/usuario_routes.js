import express from "express";
import Usuario from "../models/Usuario.js";
import jwt from "jsonwebtoken";
import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import bcrypt from "bcryptjs";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import { perfil, actualizarUsuario, actualizarPassword } 
from "../controllers/usuario_controller.js";
import fetch from "node-fetch";

const router = express.Router();

const BLACKLISTED_DOMAINS = [
    "hotmail.com", "outlook.com", "yahoo.com",
    "aol.com", "live.com", "icloud.com", "mail.com"
];

const domainCheck = (req, res, next) => {
    const { correoInstitucional } = req.body;
    if (correoInstitucional) {
        const dominio = correoInstitucional.split("@")[1];
        if (BLACKLISTED_DOMAINS.includes(dominio)) {
            console.log(`❌ Correo rechazado por restricción: ${correoInstitucional}`);
            return res.status(400).json({
                msg: "Solo se permiten correos institucionales o académicos."
            });
        }
    }
    next();
};

/* ---------------------------------------------------
   🟣 REGISTRO
---------------------------------------------------- */
router.post("/register", domainCheck, async (req, res) => {
    try {
        const { nombre, correoInstitucional, password } = req.body;

        if (!nombre || !correoInstitucional || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const usuarioExistente = await Usuario.findOne({ correoInstitucional });
        if (usuarioExistente) {
            return res.status(400).json({ msg: "El correo ya está registrado" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = new Usuario({
            nombre,
            correoInstitucional,
            password: hashedPassword,
            rol: "estudiante"
        });

        const token = jwt.sign(
            { id: nuevoUsuario._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        nuevoUsuario.token = token;
        await nuevoUsuario.save();

        const infoMail = await sendMailToRegister(correoInstitucional, token);
        if (!infoMail) {
            return res.status(500).json({
                msg: "Usuario creado, pero no se pudo enviar el correo de confirmacion."
            });
        }

        res.status(201).json({
            msg: "Usuario registrado correctamente. Revisa tu correo para confirmar tu cuenta."
        });
    } catch (error) {
        console.error("ERROR EN REGISTER:", error);
        res.status(500).json({ msg: "Error del servidor", error: error.message });
    }
});

/* ---------------------------------------------------
   🟣 CONFIRMAR CUENTA
---------------------------------------------------- */
router.get("/confirmar/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ token });

    if (!usuario) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    usuario.token = null;
    usuario.confirmEmail = true;
    await usuario.save();

    res.json({ msg: "Cuenta confirmada correctamente" });

  } catch (error) {
    console.error("ERROR EN CONFIRMAR:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

/* ---------------------------------------------------
   REENVIAR CONFIRMACION
---------------------------------------------------- */
router.post("/reenviar-confirmacion", async (req, res) => {
    try {
        const { correoInstitucional } = req.body;

        if (!correoInstitucional) {
            return res.status(400).json({ msg: "El correo es obligatorio" });
        }

        const usuario = await Usuario.findOne({ correoInstitucional });
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        if (usuario.confirmEmail) {
            return res.status(400).json({ msg: "La cuenta ya esta confirmada" });
        }

        const token = jwt.sign(
            { id: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        usuario.token = token;
        await usuario.save();

        const infoMail = await sendMailToRegister(correoInstitucional, token);
        if (!infoMail) {
            return res.status(500).json({ msg: "No se pudo reenviar el correo de confirmacion" });
        }

        res.json({ msg: "Correo de confirmacion reenviado correctamente" });
    } catch (error) {
        console.error("ERROR REENVIAR CONFIRMACION:", error);
        res.status(500).json({ msg: "Error del servidor" });
    }
});

/* ---------------------------------------------------
   🟣 LOGIN
---------------------------------------------------- */
router.post("/login", async (req, res) => {
    try {
        const { correoInstitucional, password } = req.body;

        if (!correoInstitucional || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const usuario = await Usuario.findOne({ correoInstitucional });
        if (!usuario)
            return res.status(400).json({ msg: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Contraseña incorrecta" });

        if (!usuario.confirmEmail) {
            return res.status(400).json({
                msg: "Debes confirmar tu cuenta por correo antes de iniciar sesión."
            });
        }

        const token = jwt.sign(
            { id: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            nombre: usuario.nombre,
            correoInstitucional: usuario.correoInstitucional,
            rol: usuario.rol,
            fotoPerfil: usuario.avatar || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error del servidor" });
    }
});

/* ---------------------------------------------------
   🟣 FORGOT PASSWORD (ENVIAR CORREO)
---------------------------------------------------- */
router.post("/olvide-password", async (req, res) => {
    try {
        const { correoInstitucional } = req.body;

        if (!correoInstitucional) {
            return res.status(400).json({ msg: "El correo es obligatorio" });
        }

        const usuario = await Usuario.findOne({ correoInstitucional });
        if (!usuario) {
            return res.status(400).json({ msg: "El correo no está registrado" });
        }

        const resetToken = jwt.sign(
            { id: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        usuario.resetToken = resetToken;
        usuario.resetTokenExpire = Date.now() + 15 * 60 * 1000;
        await usuario.save();

        await sendMailToRecoveryPassword(correoInstitucional, resetToken);

        res.json({ msg: "Hemos enviado un enlace para restablecer tu contraseña." });

    } catch (error) {
        console.error("ERROR EN FORGOT PASSWORD:", error);
        res.status(500).json({ msg: "Error del servidor" });
    }
});

/* ---------------------------------------------------
   🟣 RESET PASSWORD (GUARDAR NUEVA CONTRASEÑA)
---------------------------------------------------- */
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ msg: "La nueva contraseña es obligatoria" });
        }

        const usuario = await Usuario.findOne({
            resetToken: token,
            resetTokenExpire: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ msg: "Token inválido o expirado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        usuario.password = hashedPassword;
        usuario.resetToken = null;
        usuario.resetTokenExpire = null;

        await usuario.save();

        res.json({ msg: "Contraseña restablecida correctamente." });

    } catch (error) {
        console.error("ERROR EN RESET PASSWORD:", error);
        res.status(500).json({ msg: "Error del servidor" });
    }
});

/* ---------------------------------------------------
   🟣 FRASE MOTIVADORA
---------------------------------------------------- */
router.get("/frase", async (req, res) => {
    try {
        const response = await fetch("https://zenquotes.io/api/random");
        const data = await response.json();

        // Validación para no romper React si data está vacío
        if (!data || !data[0]) {
            return res.json({ q: "¡Sigue adelante!", a: "Sistema" });
        }

        // Devolver solo un objeto {q, a} para React
        res.json({ q: data[0].q, a: data[0].a });

    } catch (error) {
        console.error("ERROR FRASE:", error);
        res.status(500).json({ q: "¡Sigue adelante!", a: "Sistema" });
    }
});

router.get("/perfil", verificarTokenJWT, perfil);
router.put("/actualizar-perfil", verificarTokenJWT, actualizarUsuario);
router.put("/actualizar-password", verificarTokenJWT, actualizarPassword);

export default router;
