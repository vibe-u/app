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
    likes: {
      type: Number,
      default: 0,
    },
    comentarios: [
      {
        texto: { type: String, default: "" },
        usuario: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Post", postSchema);
