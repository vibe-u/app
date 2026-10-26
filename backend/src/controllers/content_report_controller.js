import ContentReport from "../models/ContentReport.js";
import Post from "../models/Post.js";
import Grupo from "../models/Grupos.js";
import AccountDeletionRequest from "../models/AccountDeletionRequest.js";
import { registerAdminAction } from "../utils/adminAudit.js";

export const crearReportePublicacion = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ msg: "Explica el motivo del reporte con al menos 10 caracteres." });
    }

    const post = await Post.findById(req.params.id).select("texto usuario");
    if (!post) return res.status(404).json({ msg: "Publicación no encontrada." });
    if (post.usuario.toString() === req.usuario._id.toString()) {
      return res.status(400).json({ msg: "No puedes reportar tu propia publicación." });
    }

    const report = await ContentReport.create({
      reporter: req.usuario._id,
      reporterName: req.usuario.nombre,
      targetType: "publicacion",
      targetId: String(post._id),
      targetName: post.texto?.slice(0, 160) || "Publicación sin texto",
      targetContent: post.texto || "",
      reason,
    });
    res.status(201).json({ msg: "Reporte enviado para revisión.", reportId: report._id });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ msg: "Ya enviaste un reporte pendiente para esta publicación." });
    }
    console.error("Error al reportar publicación:", error);
    res.status(500).json({ msg: "No se pudo enviar el reporte." });
  }
};

export const crearReportePublicacionGrupo = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ msg: "Explica el motivo del reporte con al menos 10 caracteres." });
    }
    const grupo = await Grupo.findById(req.params.id).select("nombre creadorEmail posts");
    if (!grupo) return res.status(404).json({ msg: "Comunidad no encontrada." });
    const post = grupo.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ msg: "Publicación no encontrada." });
    if (post.autorEmail === req.usuario.correoInstitucional) {
      return res.status(400).json({ msg: "No puedes reportar tu propia publicación." });
    }

    const report = await ContentReport.create({
      reporter: req.usuario._id,
      reporterName: req.usuario.nombre,
      targetType: "publicacion_grupo",
      targetId: String(post._id),
      groupId: grupo._id,
      targetName: `${grupo.nombre}: ${post.contenido?.slice(0, 120) || "Publicación sin texto"}`,
      targetContent: post.contenido || "",
      reason,
    });
    res.status(201).json({ msg: "Reporte enviado para revisión.", reportId: report._id });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ msg: "Ya enviaste un reporte pendiente para esta publicación." });
    }
    console.error("Error al reportar publicación de comunidad:", error);
    res.status(500).json({ msg: "No se pudo enviar el reporte." });
  }
};

export const listarReportesPendientes = async (_req, res) => {
  try {
    const reportes = await ContentReport.find({ status: "pendiente" })
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("reporter", "nombre correoInstitucional")
      .lean();
    res.json(reportes);
  } catch (error) {
    console.error("Error al listar reportes:", error);
    res.status(500).json({ msg: "No se pudieron cargar los reportes." });
  }
};

export const revisarReporte = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["revisado", "descartado"].includes(status)) {
      return res.status(400).json({ msg: "Estado de revisión inválido." });
    }
    const report = await ContentReport.findOneAndUpdate(
      { _id: req.params.id, status: "pendiente" },
      { $set: { status, reviewedBy: req.usuario._id, reviewedAt: new Date() } },
      { new: true }
    );
    if (!report) return res.status(404).json({ msg: "El reporte ya fue revisado o no existe." });

    await registerAdminAction(req, {
      action: status === "revisado" ? "Revisar reporte de publicación" : "Descartar reporte de publicación",
      targetType: "publicacion",
      targetId: report.targetId,
      targetName: report.targetName,
      details: `Motivo del reporte: ${report.reason}`,
    });
    res.json({ msg: "Reporte actualizado.", report });
  } catch (error) {
    console.error("Error al revisar reporte:", error);
    res.status(500).json({ msg: "No se pudo actualizar el reporte." });
  }
};

export const getAdminWorkflowNotifications = async (_req, res) => {
  try {
    const [reportCount, deletionCount, newestReport, newestDeletion] = await Promise.all([
      ContentReport.countDocuments({ status: "pendiente" }),
      AccountDeletionRequest.countDocuments({ status: "pendiente" }),
      ContentReport.findOne({ status: "pendiente" }).sort({ createdAt: -1 }).lean(),
      AccountDeletionRequest.findOne({ status: "pendiente" }).sort({ createdAt: -1 }).lean(),
    ]);
    const notifications = [];
    if (newestReport) {
      notifications.push({
        _id: `report-${newestReport._id}`,
        type: "content_report",
        message: `${reportCount} reporte(s) pendiente(s). Último: ${newestReport.targetName}`,
        createdAt: newestReport.createdAt,
      });
    }
    if (newestDeletion) {
      notifications.push({
        _id: `deletion-${newestDeletion._id}`,
        type: "account_deletion_request",
        message: `${deletionCount} solicitud(es) de eliminación pendiente(s). Última: ${newestDeletion.userName}`,
        createdAt: newestDeletion.createdAt,
      });
    }
    res.json(notifications);
  } catch (error) {
    console.error("Error al consultar notificaciones administrativas:", error);
    res.status(500).json({ msg: "No se pudieron cargar las notificaciones administrativas." });
  }
};
