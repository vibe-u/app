import Grupo from '../models/Grupos.js';
import { extractStoredFilename, toPublicUploadUrl } from "../utils/mediaUrl.js";

const mapCommentMedia = (req, comment = {}) => ({
    ...comment,
    autorFoto: toPublicUploadUrl(req, "avatars", comment.autorFoto),
});

const mapPostMedia = (req, post = {}) => ({
    ...post,
    autorFoto: toPublicUploadUrl(req, "avatars", post.autorFoto),
    comentarios: (post.comentarios || []).map((comment) => mapCommentMedia(req, comment)),
});

const mapGroupMedia = (req, grupo = {}) => ({
    ...grupo,
    posts: (grupo.posts || []).map((post) => mapPostMedia(req, post)),
});

// Listar grupos
export const listarGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find().sort({ createdAt: -1 });
        res.json(grupos.map((grupo) => mapGroupMedia(req, grupo.toObject())));
    } catch (error) {
        res.status(500).json({ message: "Error al listar grupos" });
    }
};

// Crear grupo
export const crearGrupo = async (req, res) => {
    try {
        const correoUsuario = req.usuario?.correoInstitucional;
        if (!correoUsuario) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const nuevoGrupo = new Grupo({
            ...req.body,
            creadorEmail: correoUsuario,
            miembrosArray: [correoUsuario],
        });

        const grupoGuardado = await nuevoGrupo.save();
        res.status(201).json(mapGroupMedia(req, grupoGuardado.toObject()));
    } catch (error) {
        res.status(400).json({ message: "Error al crear el grupo" });
    }
};

// Unirse a un grupo
export const unirseGrupo = async (req, res) => {
    try {
        const correo = req.usuario?.correoInstitucional;
        if (!correo) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        if (!grupo.miembrosArray.includes(correo)) {
            grupo.miembrosArray.push(correo);
            await grupo.save();
        }
        res.json({ message: "Unido con exito", grupo: mapGroupMedia(req, grupo.toObject()) });
    } catch (error) {
        res.status(400).json({ message: "Error al unirse" });
    }
};

// Abandonar grupo
export const abandonarGrupo = async (req, res) => {
    try {
        const correo = req.usuario?.correoInstitucional;
        if (!correo) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        grupo.miembrosArray = grupo.miembrosArray.filter((m) => m !== correo);
        await grupo.save();
        res.json({ message: "Has abandonado el grupo" });
    } catch (error) {
        res.status(400).json({ message: "Error al abandonar" });
    }
};

// Eliminar grupo
export const eliminarGrupo = async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const correo = req.usuario?.correoInstitucional;
        const rol = req.usuario?.rol;
        const puedeEliminar = rol === "administrador" || grupo.creadorEmail === correo;

        if (!puedeEliminar) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este grupo" });
        }

        await grupo.deleteOne();
        res.json({ message: "Grupo eliminado" });
    } catch (error) {
        res.status(400).json({ message: "Error al eliminar" });
    }
};

// Publicar un post
export const crearPost = async (req, res) => {
    try {
        const { contenido, foto } = req.body;
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const autor = req.usuario?.nombre || "Usuario";
        const autorFoto = extractStoredFilename(req.usuario?.avatar || "");
        const autorEmail = req.usuario?.correoInstitucional || "";

        const nuevoPost = {
            autor,
            autorFoto,
            autorEmail,
            contenido,
            foto,
        };

        grupo.posts.unshift(nuevoPost);
        await grupo.save();

        res.status(201).json(mapPostMedia(req, grupo.posts[0].toObject()));
    } catch (error) {
        res.status(400).json({ message: "Error al publicar post" });
    }
};

// Comentar un post
export const comentarPost = async (req, res) => {
    try {
        const { id, postId } = req.params;
        const { contenido } = req.body;

        const autor = req.usuario?.nombre || "Usuario";
        const autorFoto = extractStoredFilename(req.usuario?.avatar || "");
        const autorEmail = req.usuario?.correoInstitucional || "";

        const grupo = await Grupo.findById(id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const post = grupo.posts.id(postId);
        if (!post) return res.status(404).json({ message: "Post no encontrado" });

        const nuevoComentario = {
            autor,
            autorFoto,
            autorEmail,
            contenido,
            fecha: new Date(),
        };

        post.comentarios.push(nuevoComentario);
        await grupo.save();

        res.status(201).json(mapCommentMedia(req, post.comentarios[post.comentarios.length - 1].toObject()));
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error al agregar comentario" });
    }
};

// Eliminar un post
export const eliminarPost = async (req, res) => {
    try {
        const { id, postId } = req.params;
        const grupo = await Grupo.findById(id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const post = grupo.posts.id(postId);
        if (!post) return res.status(404).json({ message: "Post no encontrado" });

        const correo = req.usuario?.correoInstitucional || "";
        const rol = req.usuario?.rol || "";
        const esAdminGlobal = rol === "administrador";
        const puedeEliminar = post.autorEmail === correo || grupo.creadorEmail === correo || esAdminGlobal;

        if (!puedeEliminar) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este post" });
        }

        post.deleteOne();
        await grupo.save();
        res.json({ message: "Post eliminado", postId });
    } catch (error) {
        res.status(400).json({ message: "Error al eliminar post" });
    }
};

// Eliminar un comentario
export const eliminarComentario = async (req, res) => {
    try {
        const { id, postId, comentarioId } = req.params;
        const grupo = await Grupo.findById(id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const post = grupo.posts.id(postId);
        if (!post) return res.status(404).json({ message: "Post no encontrado" });

        const comentario = post.comentarios.id(comentarioId);
        if (!comentario) return res.status(404).json({ message: "Comentario no encontrado" });

        const correo = req.usuario?.correoInstitucional || "";
        const rol = req.usuario?.rol || "";
        const esAdminGlobal = rol === "administrador";
        const puedeEliminar =
            comentario.autorEmail === correo ||
            post.autorEmail === correo ||
            grupo.creadorEmail === correo ||
            esAdminGlobal;

        if (!puedeEliminar) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este comentario" });
        }

        comentario.deleteOne();
        await grupo.save();
        res.json({ message: "Comentario eliminado", comentarioId });
    } catch (error) {
        res.status(400).json({ message: "Error al eliminar comentario" });
    }
};
