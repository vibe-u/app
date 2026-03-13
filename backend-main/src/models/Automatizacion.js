import mongoose from "mongoose";

const automatizacionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    descripcion: {
        type: String,
    },
    tipo: {
        type: String,
        enum: ["REPORTE", "IA", "ALERTA"],
        required: true,
    },
    grupo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grupo",
        required: true,
    },
    activo: {
        type: Boolean,
        default: true,
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
    },
    }, {
    timestamps: true
});

export default mongoose.model("Automatizacion", automatizacionSchema);
