import Grupo from "../models/Grupos.js";

export const reporteGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find();

        const reporte = grupos.map((grupo) => ({
        grupo: grupo.nombre,
        totalUsuarios: grupo.miembrosArray.length,
        totalPosts: grupo.posts.length,
        creadorEmail: grupo.creadorEmail
        }));

        res.json({
        ok: true,
        reporte
        });

    } catch (error) {
        console.error("ERROR REPORTE:", error);
        res.status(500).json({
        ok: false,
        message: "Error al generar reporte de grupos"
        });
    }
};
