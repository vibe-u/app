import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorUser: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ["usuario", "publicacion", "sistema"], required: true },
    targetId: { type: String, default: "" },
    targetName: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { timestamps: true, collection: "admin_audit_logs" }
);

adminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);
