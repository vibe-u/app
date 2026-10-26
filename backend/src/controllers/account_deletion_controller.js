import AccountDeletionRequest from "../models/AccountDeletionRequest.js";
import Usuario from "../models/Usuario.js";
import { registerAdminAction } from "../utils/adminAudit.js";

export const solicitarEliminacionCuenta = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ msg: "El motivo es obligatorio y debe tener al menos 10 caracteres." });
    }
    const pending = await AccountDeletionRequest.findOne({ user: req.usuario._id, status: "pendiente" });
    if (pending) return res.status(409).json({ msg: "Ya tienes una solicitud de eliminación pendiente." });

    const request = await AccountDeletionRequest.create({
      user: req.usuario._id,
      userName: req.usuario.nombre,
      userEmail: req.usuario.correoInstitucional,
      reason,
    });
    res.status(201).json({ msg: "Solicitud enviada al equipo administrador para revisión.", requestId: request._id });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ msg: "Ya tienes una solicitud de eliminación pendiente." });
    }
    console.error("Error al solicitar eliminación de cuenta:", error);
    res.status(500).json({ msg: "No se pudo enviar la solicitud." });
  }
};

export const obtenerEstadoSolicitudEliminacion = async (req, res) => {
  try {
    const request = await AccountDeletionRequest.findOne({ user: req.usuario._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(request);
  } catch (error) {
    console.error("Error al consultar solicitud de eliminación:", error);
    res.status(500).json({ msg: "No se pudo consultar el estado de la solicitud." });
  }
};

export const listarSolicitudesEliminacion = async (_req, res) => {
  try {
    const requests = await AccountDeletionRequest.find({ status: "pendiente" })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json(requests);
  } catch (error) {
    console.error("Error al listar solicitudes de eliminación:", error);
    res.status(500).json({ msg: "No se pudieron cargar las solicitudes." });
  }
};

export const revisarSolicitudEliminacion = async (req, res) => {
  try {
    const { status, reviewNote = "" } = req.body || {};
    if (!["aprobada", "rechazada"].includes(status)) {
      return res.status(400).json({ msg: "La decisión de revisión no es válida." });
    }
    const request = await AccountDeletionRequest.findOne({
      _id: req.params.id,
      status: "pendiente",
    });
    if (!request) return res.status(404).json({ msg: "La solicitud ya fue revisada o no existe." });

    if (status === "aprobada") {
      const deletion = await Usuario.deleteOne({ _id: request.user });
      if (!deletion.deletedCount) {
        return res.status(404).json({ msg: "La cuenta solicitante ya no existe." });
      }
    }

    request.status = status;
    request.reviewedBy = req.usuario._id;
    request.reviewedAt = new Date();
    request.reviewNote = String(reviewNote).trim().slice(0, 1000);
    await request.save();
    await registerAdminAction(req, {
      action: status === "aprobada" ? "Aprobar eliminación de cuenta" : "Rechazar eliminación de cuenta",
      targetType: "usuario",
      targetId: String(request.user),
      targetName: `${request.userName} (${request.userEmail})`,
      details: `Motivo: ${request.reason}${request.reviewNote ? `; revisión: ${request.reviewNote}` : ""}`,
    });
    res.json({ msg: status === "aprobada" ? "Cuenta eliminada." : "Solicitud rechazada.", request });
  } catch (error) {
    console.error("Error al revisar solicitud de eliminación:", error);
    res.status(500).json({ msg: "No se pudo revisar la solicitud." });
  }
};
