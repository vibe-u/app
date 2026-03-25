// middlewares/JWT.js
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" });
    }

    try {
        const token = authorization.split(" ")[1];

        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const usuarioBDD = await Usuario.findById(id)
            .lean()
            .select("-password -token -resetToken -resetTokenExpire");

        if (!usuarioBDD) {
            return res.status(401).json({ msg: "Usuario no encontrado" });
        }

        req.usuario = usuarioBDD;
        next();

    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" });
    }
};

export { verificarTokenJWT };
