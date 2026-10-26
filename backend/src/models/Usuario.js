import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const savedPostSchema = new mongoose.Schema(
  {
    postKey: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
    groupName: { type: String, default: "" },
    postId: { type: mongoose.Schema.Types.ObjectId, required: true },
    autor: { type: String, default: "" },
    contenido: { type: String, default: "" },
    foto: { type: String, default: "" },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String },
  correoInstitucional: { type: String, required: true, unique: true, lowercase: true,trim: true, match: /@epn\.edu\.ec$/i },
  password: { type: String, required: true },
  rol: { type: String, default: "estudiante" },
  suspendido: { type: Boolean, default: false },
  motivoSuspension: { type: String, default: "" },
  suspendidoAt: { type: Date, default: null },
  token: { type: String, default: null },
  confirmEmail: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
  resetTokenExpire: { type: Date, default: null },
  avatar: { type: String, default: null },

  // NUEVOS CAMPOS
  telefono: { type: String, default: "" },
  direccion: { type: String, default: "" },
  cedula: { type: String, default: "" },
  descripcion: { type: String, default: "" },
  universidad: { type: String, default: "" },
  carrera: { type: String, default: "" },
  intereses: { type: [String], default: [] },
  perfilPublico: { type: Boolean, default: true },
  savedPosts: { type: [savedPostSchema], default: [] },
  grupoInvitaciones: [
    {
      grupo: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo" },
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  amigos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  solicitudesEnviadas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  solicitudesRecibidas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  matchLikesEnviados: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  matchLikesRecibidos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  matchRechazados: { type: [mongoose.Schema.Types.Mixed], default: [] },
  matchNotificaciones: [
    {
      type: {
        type: String,
        enum: ["match_like", "match_success"],
        required: true,
      },
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
      withUser: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// 🔐 Encriptar contraseña
usuarioSchema.methods.encryptPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// 🔍 Comparar contraseña
usuarioSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 🔑 JWT para login
usuarioSchema.methods.createJWT = function() {
  return jwt.sign(
    { id: this._id, nombre: this.nombre, correo: this.correoInstitucional },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// 🔑 Token temporal
usuarioSchema.methods.createToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

export default mongoose.model("Usuario", usuarioSchema);
