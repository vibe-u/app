import express from "express";
import {
  obtenerPosts,
  crearPost,
  toggleLikePost,
  comentarPost,
  uploadPostMedia,
  eliminarPost,
  eliminarComentarioPost,
} from "../controllers/posts.controller.js";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/posts", obtenerPosts);
router.post("/posts", verificarTokenJWT, crearPost);
router.post("/posts/upload-media", verificarTokenJWT, upload.single("media"), uploadPostMedia);
router.post("/posts/:id/like", verificarTokenJWT, toggleLikePost);
router.post("/posts/:id/comentar", verificarTokenJWT, comentarPost);
router.delete("/posts/:id", verificarTokenJWT, eliminarPost);
router.delete("/posts/:id/comentarios/:commentId", verificarTokenJWT, eliminarComentarioPost);

export default router;
