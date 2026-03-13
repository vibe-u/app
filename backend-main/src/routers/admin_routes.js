import express from "express";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import esAdmin from "../middlewares/esAdmin.js";

import {
    getAllUsers,
    deleteUser,
    actualizarUsuario
} from "../controllers/usuario_controller.js";

const router = express.Router();

/* ===== USUARIOS (SOLO ADMIN) ===== */

// Listar usuarios
router.get(
    "/usuarios",
    verificarTokenJWT,
    esAdmin,
    getAllUsers
);

// Actualizar usuario
router.put(
    "/usuarios/:id",
    verificarTokenJWT,
    esAdmin,
    actualizarUsuario
);

// Eliminar usuario
router.delete(
    "/usuarios/:id",
    verificarTokenJWT,
    esAdmin,
    deleteUser
);

export default router;
