import mongoose from "mongoose";

const contentReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    reporterName: { type: String, required: true },
    targetType: { type: String, enum: ["publicacion", "publicacion_grupo"], required: true },
    targetId: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", default: null },
    targetName: { type: String, default: "" },
    targetContent: { type: String, default: "", maxlength: 3000 },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pendiente", "revisado", "descartado"], default: "pendiente", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

contentReportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { status: "pendiente" } }
);

export default mongoose.model("ContentReport", contentReportSchema);
