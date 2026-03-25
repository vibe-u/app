import express from 'express';
const router = express.Router();

import * as grupoController from '../controllers/controller_grupos.js';
import { verificarTokenJWT } from "../middlewares/JWT.js";

router.get('/listar', grupoController.listarGrupos);
router.post('/crear', verificarTokenJWT, grupoController.crearGrupo);
router.delete('/:id', verificarTokenJWT, grupoController.eliminarGrupo);
router.post('/:id/unirse', verificarTokenJWT, grupoController.unirseGrupo);
router.post('/:id/abandonar', verificarTokenJWT, grupoController.abandonarGrupo);
router.post('/:id/post', verificarTokenJWT, grupoController.crearPost);
router.delete('/:id/post/:postId', verificarTokenJWT, grupoController.eliminarPost);
router.post('/:id/post/:postId/comentar', verificarTokenJWT, grupoController.comentarPost);
router.delete('/:id/post/:postId/comentario/:comentarioId', verificarTokenJWT, grupoController.eliminarComentario);

export default router;
