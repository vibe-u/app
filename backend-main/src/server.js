// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usuarioRouter from "./routers/usuario_routes.js";
import gruposRouter from "./routers/grupos_routes.js";
import adminRoutes from './routers/admin_routes.js';
import automatizacionRouter from "./routers/automatizacion_routes.js";
import postsRouter from "./routers/posts.routes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: process.env.URL_FRONTEND
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.set("port", process.env.PORT || 3000);

app.get("/", (req, res) => res.send("Server on"));
app.use("/api/usuarios", usuarioRouter);
app.use("/api/grupos", gruposRouter);
app.use("/api/admins", adminRoutes);
app.use("/api/automatizacion", automatizacionRouter);
app.use("/api", postsRouter);

app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"));

export default app;
