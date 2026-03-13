import express from "express";
import { obtenerPosts, crearPost } from "../controllers/posts.controller.js";
import { verificarTokenJWT } from "../middlewares/JWT.js";

const router = express.Router();

router.get("/posts", obtenerPosts);
router.post("/posts", verificarTokenJWT, crearPost);

export default router;
