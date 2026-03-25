import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    texto: { type: String, default: "" },
    imagen: { type: String, default: "" },
    video: { type: String, default: "" },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
      },
    ],
    comentarios: [
      {
        texto: { type: String, default: "" },
        usuario: { type: String, default: "" },
        usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      },
    ],
    moderation: {
      status: {
        type: String,
        enum: ["active", "flagged", "disabled"],
        default: "active",
      },
      aiScore: { type: Number, default: 0 },
      aiVerdict: {
        type: String,
        enum: ["apto", "no_apto"],
        default: "apto",
      },
      aiReasons: [{ type: String }],
      aiModel: { type: String, default: "heuristic-v1" },
      aiEvaluatedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
      reviewedAt: { type: Date, default: null },
      deactivationReason: { type: String, default: "" },
      deactivatedAt: { type: Date, default: null },
      notificationMessage: { type: String, default: "" },
      notificationCreatedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Post", postSchema);
