import AdminAuditLog from "../models/AdminAuditLog.js";
import Usuario from "../models/Usuario.js";
import { registerAdminAction } from "../utils/adminAudit.js";
import { once } from "node:events";

const escapeCsvValue = (value) => {
  let safeValue = String(value ?? "");
  if (/^\s*[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const toCsvRow = (values) => `${values.map(escapeCsvValue).join(",")}\r\n`;

export const listarBitacora = async (req, res) => {
  try {
    const registros = await AdminAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json(registros);
  } catch (error) {
    console.error("Error al consultar la bitacora administrativa:", error);
    res.status(500).json({ msg: "No se pudo consultar la bitacora administrativa" });
  }
};

export const exportarBitacora = async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bitacora-administrativa.csv"');
    res.write("\uFEFF");
    if (!res.write(toCsvRow([
      "Fecha",
      "Administrador",
      "Correo del administrador",
      "Rol",
      "Accion",
      "Tipo de objetivo",
      "ID del objetivo",
      "Usuario o publicacion",
      "Detalles",
    ]))) {
      await once(res, "drain");
    }

    const cursor = AdminAuditLog.find().sort({ createdAt: -1 }).lean().cursor();
    for await (const registro of cursor) {
      if (!res.write(toCsvRow([
        registro.createdAt?.toISOString(),
        registro.actorName,
        registro.actorEmail,
        registro.actorRole,
        registro.action,
        registro.targetType,
        registro.targetId,
        registro.targetName,
        registro.details,
      ]))) {
        await once(res, "drain");
      }
    }
    res.end();
  } catch (error) {
    console.error("Error al exportar la bitacora administrativa:", error);
    if (res.headersSent) {
      res.destroy(error);
    } else {
      res.status(500).json({ msg: "No se pudo exportar la bitacora administrativa" });
    }
  }
};

export const cambiarSuspensionUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspendido, motivo = "" } = req.body || {};

    if (typeof suspendido !== "boolean") {
      return res.status(400).json({ msg: "Debes indicar si la cuenta queda suspendida" });
    }
    if (String(id) === String(req.usuario._id)) {
      return res.status(400).json({ msg: "No puedes suspender ni reactivar tu propia cuenta" });
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.rol !== "estudiante") {
      return res.status(403).json({ msg: "Solo se pueden suspender o reactivar cuentas de estudiantes." });
    }
    if (usuario.suspendido === suspendido) {
      return res.status(400).json({
        msg: suspendido ? "El usuario ya está suspendido" : "El usuario ya está activo",
      });
    }

    const cleanedReason = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
    usuario.suspendido = suspendido;
    usuario.motivoSuspension = suspendido ? cleanedReason : "";
    usuario.suspendidoAt = suspendido ? new Date() : null;
    await usuario.save({ validateModifiedOnly: true });

    await registerAdminAction(req, {
      action: suspendido ? "Suspender usuario" : "Reactivar usuario",
      targetType: "usuario",
      targetId: String(usuario._id),
      targetName: `${usuario.nombre} (${usuario.correoInstitucional})`,
      details: suspendido ? cleanedReason : "Se reactivó la cuenta.",
    });

    res.json({
      msg: suspendido ? "Usuario suspendido correctamente" : "Usuario reactivado correctamente",
      suspendido: usuario.suspendido,
      motivoSuspension: usuario.motivoSuspension,
    });
  } catch (error) {
    console.error("Error al cambiar la suspension del usuario:", error);
    const validationFields = error?.name === "ValidationError"
      ? Object.keys(error.errors || {}).join(", ")
      : "";
    res.status(500).json({
      msg: validationFields
        ? `No se pudo cambiar el estado del usuario por datos inválidos: ${validationFields}.`
        : "No se pudo cambiar el estado del usuario. Verifica los datos e inténtalo de nuevo.",
    });
  }
};
