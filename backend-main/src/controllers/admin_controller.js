import Admin from "../models/admin.js";

// Obtener todos los administradores
export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear administrador
export const createAdmin = async (req, res) => {
  try {
    const admin = new Admin(req.body);
    const savedAdmin = await admin.save();
    res.status(201).json(savedAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener admin por ID
export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin no encontrado" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar admin
export const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar admin
export const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Administrador eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
