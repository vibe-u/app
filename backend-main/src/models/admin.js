import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      default: "administrador"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Admin", adminSchema);