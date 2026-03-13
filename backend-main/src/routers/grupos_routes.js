import express from 'express';
const router = express.Router();

// Importamos todas las funciones del controlador
import * as grupoController from '../controllers/controller_grupos.js';
import { verificarTokenJWT } from "../middlewares/JWT.js";

// Definición de rutas
router.get('/listar', grupoController.listarGrupos);
router.post('/crear', verificarTokenJWT, grupoController.crearGrupo);
router.delete('/:id', verificarTokenJWT, grupoController.eliminarGrupo);
router.post('/:id/unirse', verificarTokenJWT, grupoController.unirseGrupo);
router.post('/:id/abandonar', verificarTokenJWT, grupoController.abandonarGrupo);
router.post('/:id/post', verificarTokenJWT, grupoController.crearPost);

// 🔴 AQUÍ ESTABA EL ERROR
router.post('/:id/post/:postId/comentar', verificarTokenJWT, grupoController.comentarPost);

// Exportación
export default router;
