import express from "express";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import esAdmin from "../middlewares/esAdmin.js";

import {
    getAllUsers,
    deleteUser,
    actualizarUsuario
} from "../controllers/usuario_controller.js";
import {
    listarPostsModeracion,
    analizarPostsConIa,
    analizarPostConIa,
    desactivarPostModeracion,
    reactivarPostModeracion,
} from "../controllers/admin_moderation_controller.js";

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

/* ===== MODERACION DE PUBLICACIONES (SOLO ADMIN) ===== */
router.get(
    "/posts/moderacion",
    verificarTokenJWT,
    esAdmin,
    listarPostsModeracion
);

router.post(
    "/posts/moderacion/analizar",
    verificarTokenJWT,
    esAdmin,
    analizarPostsConIa
);

router.post(
    "/posts/moderacion/:id/analizar",
    verificarTokenJWT,
    esAdmin,
    analizarPostConIa
);

router.put(
    "/posts/moderacion/:id/desactivar",
    verificarTokenJWT,
    esAdmin,
    desactivarPostModeracion
);

router.put(
    "/posts/moderacion/:id/reactivar",
    verificarTokenJWT,
    esAdmin,
    reactivarPostModeracion
);

export default router;
