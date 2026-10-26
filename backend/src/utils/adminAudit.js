import AdminAuditLog from "../models/AdminAuditLog.js";

export const registerAdminAction = (req, action) =>
  AdminAuditLog.create({
    actorUser: req.usuario._id,
    actorName: req.usuario.nombre,
    actorEmail: req.usuario.correoInstitucional,
    actorRole: req.usuario.rol,
    ...action,
  });
