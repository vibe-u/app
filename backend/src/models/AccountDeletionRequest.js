import mongoose from "mongoose";

const accountDeletionRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pendiente", "aprobada", "rechazada"], default: "pendiente", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

accountDeletionRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pendiente" } }
);

export default mongoose.model("AccountDeletionRequest", accountDeletionRequestSchema);
