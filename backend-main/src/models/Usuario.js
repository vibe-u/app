import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String },
  correoInstitucional: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, default: "estudiante" },
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
  amigos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  solicitudesEnviadas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  solicitudesRecibidas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }]
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
