import Grupo from '../models/Grupos.js';

// Listar grupos
export const listarGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find().sort({ createdAt: -1 });
        res.json(grupos);
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
        res.status(201).json(grupoGuardado);
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
        res.json({ message: "Unido con exito", grupo });
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
        const autorFoto = req.usuario?.avatar || "";
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

        res.status(201).json(grupo.posts[0]);
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
        const autorFoto = req.usuario?.avatar || "";
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

        res.status(201).json(post.comentarios[post.comentarios.length - 1]);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error al agregar comentario" });
    }
};
