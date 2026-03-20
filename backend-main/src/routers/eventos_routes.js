import express from "express";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import {
  crearEvento,
  listarEventosUniversidad,
  notificacionesEventos,
  toggleAsistire,
} from "../controllers/eventos_controller.js";

const router = express.Router();

router.use(verificarTokenJWT);

router.get("/", listarEventosUniversidad);
router.post("/", crearEvento);
router.post("/:id/asistire", toggleAsistire);
router.get("/notificaciones", notificacionesEventos);

export default router;
