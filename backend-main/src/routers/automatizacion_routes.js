import express from "express";
import { reporteGrupos } from "../controllers/automatizacion_controller.js";
import { verificarTokenJWT } from "../middlewares/JWT.js";
import esAdmin from "../middlewares/esAdmin.js";

const router = express.Router();

router.get(
    "/reporte/grupos",
    verificarTokenJWT,
    esAdmin,
    reporteGrupos
);

export default router;


