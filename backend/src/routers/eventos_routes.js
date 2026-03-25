import express from "express";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
  listarEventosUniversidad,
  notificacionesEventos,
  toggleAsistire,
} from "../controllers/eventos_controller.js";

const router = express.Router();

router.use(verificarTokenJWT);

router.get("/", listarEventosUniversidad);
router.post("/", crearEvento);
router.put("/:id", actualizarEvento);
router.delete("/:id", eliminarEvento);
router.post("/:id/asistire", toggleAsistire);
router.get("/notificaciones", notificacionesEventos);

export default router;
