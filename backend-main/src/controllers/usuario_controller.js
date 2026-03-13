// src/controllers/usuario_controller.js
import Usuario from "../models/Usuario.js";
import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");

const saveAvatarIfBase64 = (avatar, userId) => {
    if (!avatar || typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
        return avatar;
    }

    const match = avatar.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return avatar;

    const [, rawExt, base64Data] = match;
    const ext = rawExt === "jpeg" ? "jpg" : rawExt.toLowerCase();
    const allowed = new Set(["jpg", "png", "webp", "gif"]);
    const safeExt = allowed.has(ext) ? ext : "jpg";

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    const filename = `avatar-${userId}-${Date.now()}.${safeExt}`;
    const fullPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(base64Data, "base64"));

    const baseUrl = process.env.URL_BACKEND || "http://localhost:3000";
    return `${baseUrl}/uploads/avatars/${filename}`;
};

/* =========================================
   🔵 REGISTRO DE USUARIO
========================================= */
const registro = async (req, res) => {
    try {
        const { correoInstitucional, password } = req.body;

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos." });
        }

        const existe = await Usuario.findOne({ correoInstitucional });
        if (existe) {
            return res.status(400).json({ msg: "El correo institucional ya está registrado." });
        }

        const nuevoUsuario = new Usuario(req.body);
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password);
        const token = nuevoUsuario.createToken();
        nuevoUsuario.token = token;

        await nuevoUsuario.save();
        await sendMailToRegister(correoInstitucional, token);

        res.status(200).json({ msg: "Revisa tu correo institucional para confirmar tu cuenta." });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor: ${error.message}` });
    }
};

/* =========================================
   🔵 CONFIRMAR CORREO
========================================= */
const confirmarMail = async (req, res) => {
    try {
        const { token } = req.params;
        const usuarioBDD = await Usuario.findOne({ token });
        if (!usuarioBDD) return res.redirect(`${process.env.URL_FRONTEND}/confirmar/error`);

        usuarioBDD.token = null;
        usuarioBDD.confirmEmail = true;
        await usuarioBDD.save();

        return res.redirect(`${process.env.URL_FRONTEND}/confirmar/exito`);
    } catch {
        return res.redirect(`${process.env.URL_FRONTEND}/confirmar/error`);
    }
};

/* =========================================
   🔵 RECUPERAR CONTRASEÑA
========================================= */
const recuperarPassword = async (req, res) => {
    try {
        const { correoInstitucional } = req.body;
        const usuarioBDD = await Usuario.findOne({ correoInstitucional });
        if (!usuarioBDD) return res.status(404).json({ msg: "El usuario no registrado" });

        const token = usuarioBDD.createToken();
        usuarioBDD.token = token;
        await usuarioBDD.save();

        await sendMailToRecoveryPassword(correoInstitucional, token);
        res.status(200).json({ msg: "Revisa tu correo para restablecer tu contraseña" });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error - ${error.message}` });
    }
};

const comprobarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const usuarioBDD = await Usuario.findOne({ token });
        if (!usuarioBDD) return res.status(404).json({ msg: "Token inválido" });
        res.status(200).json({ msg: "Token confirmado" });
    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

const crearNuevoPassword = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body;
        const { token } = req.params;

        if (password !== confirmpassword) return res.status(400).json({ msg: "No coinciden" });

        const usuarioBDD = await Usuario.findOne({ token });
        if (!usuarioBDD) return res.status(404).json({ msg: "Token inválido" });

        usuarioBDD.password = await usuarioBDD.encryptPassword(password);
        usuarioBDD.token = null;
        await usuarioBDD.save();

        res.status(200).json({ msg: "Contraseña actualizada" });
    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

/* =========================================
   🔵 LOGIN
========================================= */
const loginUsuario = async (req, res) => {
    try {
        const { correoInstitucional, password, rol: rolSeleccionado } = req.body;
        const usuarioBDD = await Usuario.findOne({ correoInstitucional });
        if (!usuarioBDD) return res.status(404).json({ msg: "Usuario no registrado" });
        if (!usuarioBDD.confirmEmail) return res.status(400).json({ msg: "Confirma tu correo" });

        const passwordOK = await usuarioBDD.matchPassword(password);
        if (!passwordOK) return res.status(400).json({ msg: "Contraseña incorrecta" });

        // Validación de rol (opcional)
        if (rolSeleccionado && usuarioBDD.rol !== rolSeleccionado) {
            return res.status(403).json({
                msg: `Acceso denegado. Tu rol real es (${usuarioBDD.rol}) 🚫`
            });
        }

        const token = usuarioBDD.createJWT();

        res.status(200).json({
            msg: "Inicio de sesión exitoso",
            token,
            nombre: usuarioBDD.nombre,
            apellido: usuarioBDD.apellido,
            rol: usuarioBDD.rol,
            fotoPerfil: usuarioBDD.avatar || null
        });
    } catch (error) {
        res.status(500).json({ msg: `Error: ${error.message}` });
    }
};

/* =========================================
   🔵 PERFIL
========================================= */
const perfil = (req, res) => {
    const { password, token, ...usuarioSeguro } = req.usuario;
    res.status(200).json(usuarioSeguro);
};

/* =========================================
   🔵 ACTUALIZAR USUARIO (PERFIL Y ROL)
========================================= */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params; // Si admin quiere actualizar a otro usuario
        const { nombre, telefono, direccion, cedula, descripcion, universidad, carrera, avatar, rol } = req.body;

        const idAActualizar = id || req.usuario._id;
        const usuarioBDD = await Usuario.findById(idAActualizar);
        if (!usuarioBDD) return res.status(404).json({ msg: "Usuario no encontrado" });

        usuarioBDD.nombre = nombre || usuarioBDD.nombre;
        usuarioBDD.telefono = telefono || usuarioBDD.telefono;
        usuarioBDD.direccion = direccion || usuarioBDD.direccion;
        usuarioBDD.cedula = cedula || usuarioBDD.cedula;
        usuarioBDD.descripcion = descripcion || usuarioBDD.descripcion;
        usuarioBDD.universidad = universidad || usuarioBDD.universidad;
        usuarioBDD.carrera = carrera || usuarioBDD.carrera;
        usuarioBDD.avatar = saveAvatarIfBase64(avatar, usuarioBDD._id) || usuarioBDD.avatar;

        // Solo administradores pueden cambiar roles
        if (rol) {
            if (req.usuario?.rol !== "administrador") {
                return res.status(403).json({ msg: "Solo un administrador puede cambiar roles" });
            }
            usuarioBDD.rol = rol;
        }

        await usuarioBDD.save();

        res.status(200).json({
            msg: "Usuario actualizado",
            rol: usuarioBDD.rol,
            fotoPerfil: usuarioBDD.avatar
        });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar usuario" });
    }
};

/* =========================================
   🔵 ACTUALIZAR PASSWORD
========================================= */
const actualizarPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const usuarioBDD = await Usuario.findById(req.usuario._id);

        const isMatch = await usuarioBDD.matchPassword(oldPassword);
        if (!isMatch) return res.status(400).json({ msg: "Password actual incorrecto" });

        usuarioBDD.password = await usuarioBDD.encryptPassword(newPassword);
        await usuarioBDD.save();

        res.status(200).json({ msg: "Password actualizado" });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar password" });
    }
};

/* =========================================
   🔴 ELIMINAR USUARIO (SOLO ADMIN)
========================================= */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioBDD = await Usuario.findById(id);
        if (!usuarioBDD) return res.status(404).json({ msg: "Usuario no encontrado" });

        await usuarioBDD.deleteOne();
        res.status(200).json({ msg: "Usuario eliminado correctamente 🗑️" });
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar usuario" });
    }
};

/* =========================================
   🔵 OBTENER TODOS LOS USUARIOS (SOLO ADMIN)
========================================= */
const getAllUsers = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password -token");
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener usuarios" });
    }
};

/* =========================================
   🔵 EXPORTAR FUNCIONES
========================================= */
export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    loginUsuario,
    perfil,
    actualizarUsuario,
    actualizarPassword,
    deleteUser,
    getAllUsers
};
