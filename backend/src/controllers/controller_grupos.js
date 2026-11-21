import Grupo from '../models/Grupos.js';
import Usuario from '../models/Usuario.js';
import { extractStoredFilename, toPublicUploadUrl } from "../utils/mediaUrl.js";
import { mergeTags } from "../utils/interests.js";
import { registerAdminAction } from "../utils/adminAudit.js";

const mapCommentMedia = (req, comment = {}) => ({
    ...comment,
    autorFoto: toPublicUploadUrl(req, "avatars", comment.autorFoto),
});

const mapPostMedia = (req, post = {}) => ({
    ...post,
    autorFoto: toPublicUploadUrl(req, "avatars", post.autorFoto),
    comentarios: (post.comentarios || []).map((comment) => mapCommentMedia(req, comment)),
});

const mapGroupMedia = (req, grupo = {}) => {
    const publicGroup = { ...grupo };
    delete publicGroup.solicitudesIngreso;
    return {
        ...publicGroup,
        posts: (grupo.posts || []).map((post) => mapPostMedia(req, post)),
    };
};

const perteneceAlGrupo = (grupo, correo = "") => {
    const email = String(correo).toLowerCase();
    return String(grupo.creadorEmail || "").toLowerCase() === email ||
        (grupo.miembrosArray || []).some((member) => String(member).toLowerCase() === email);
};

// Listar grupos
export const listarGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find({ archivado: { $ne: true } }).sort({ createdAt: -1 });
        res.json(grupos.map((grupo) => mapGroupMedia(req, grupo.toObject())));
    } catch (error) {
        console.error("Error al listar grupos:", error);
        res.status(500).json({ message: "Error al listar grupos" });
    }
};

export const listarGruposArchivados = async (req, res) => {
    try {
        const filter = { archivado: true };
        if (req.usuario?.rol !== "administrador") {
            filter.creadorEmail = req.usuario?.correoInstitucional;
        }
        const grupos = await Grupo.find(filter).sort({ archivadoAt: -1 });
        res.json(grupos.map((grupo) => mapGroupMedia(req, grupo.toObject())));
    } catch (error) {
        console.error("Error al listar comunidades archivadas:", error);
        res.status(500).json({ message: "No se pudieron listar comunidades archivadas" });
    }
};

export const cambiarEstadoArchivoGrupo = async (req, res) => {
    try {
        const { archivado } = req.body || {};
        if (typeof archivado !== "boolean") {
            return res.status(400).json({ message: "Indica si deseas archivar o activar la comunidad." });
        }
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Comunidad no encontrada." });

        const correo = req.usuario?.correoInstitucional;
        const esAdmin = req.usuario?.rol === "administrador";
        if (!esAdmin && grupo.creadorEmail !== correo) {
            return res.status(403).json({ message: "Solo el creador o un administrador puede cambiar el estado." });
        }
        if (grupo.archivado === archivado) {
            return res.status(400).json({
                message: archivado ? "La comunidad ya está archivada." : "La comunidad ya está activa.",
            });
        }

        grupo.archivado = archivado;
        grupo.archivadoAt = archivado ? new Date() : null;
        grupo.archivadoPor = archivado ? correo : "";
        await grupo.save();
        if (esAdmin) {
            await registerAdminAction(req, {
                action: archivado ? "Archivar comunidad" : "Reactivar comunidad",
                targetType: "sistema",
                targetId: String(grupo._id),
                targetName: grupo.nombre,
            });
        }
        res.json({ message: archivado ? "Comunidad archivada." : "Comunidad activada.", grupo: grupo.toObject() });
    } catch (error) {
        console.error("Error al cambiar estado de archivo de comunidad:", error);
        res.status(500).json({ message: "No se pudo cambiar el estado de la comunidad." });
    }
};

// Crear grupo
export const crearGrupo = async (req, res) => {
    try {
        const correoUsuario = req.usuario?.correoInstitucional;
        if (!correoUsuario) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const nombre = String(req.body?.nombre || "").trim();
        const descripcion = String(req.body?.descripcion || "").trim().slice(0, 400);
        if (!nombre) {
            return res.status(400).json({ message: "El nombre del grupo es obligatorio" });
        }

        const nuevoGrupo = new Grupo({
            nombre,
            imagen: req.body?.imagen || "",
            descripcion,
            tags: mergeTags(req.body?.tags, nombre, descripcion),
            creadorEmail: correoUsuario,
            miembrosArray: [correoUsuario],
        });

        const grupoGuardado = await nuevoGrupo.save();
        res.status(201).json(mapGroupMedia(req, grupoGuardado.toObject()));
    } catch (error) {
        res.status(400).json({ message: "Error al crear el grupo" });
    }
};

// Solicitar unirse a un grupo; el creador aprueba el ingreso.
export const unirseGrupo = async (req, res) => {
    try {
        const correo = req.usuario?.correoInstitucional;
        if (!correo) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });
        if (grupo.archivado) return res.status(409).json({ message: "Esta comunidad está archivada." });

        const correoNormalizado = correo.toLowerCase();
        const yaEsMiembro = (grupo.miembrosArray || []).some((item) => item.toLowerCase() === correoNormalizado);
        if (yaEsMiembro) return res.status(409).json({ message: "Ya perteneces a esta comunidad." });

        const solicitudPendiente = (grupo.solicitudesIngreso || []).some(
            (item) => item.correoInstitucional?.toLowerCase() === correoNormalizado
        );
        if (!solicitudPendiente) {
            grupo.solicitudesIngreso.push({ correoInstitucional: correoNormalizado });
            await grupo.save();
        }
        res.json({ message: "Solicitud enviada al creador de la comunidad.", requested: true });
    } catch (error) {
        res.status(400).json({ message: "Error al unirse" });
    }
};

export const listarSolicitudesIngreso = async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id).lean();
        if (!grupo) return res.status(404).json({ message: "Comunidad no encontrada." });
        const correo = req.usuario?.correoInstitucional;
        if (grupo.creadorEmail !== correo && req.usuario?.rol !== "administrador") {
            return res.status(403).json({ message: "Solo el creador puede revisar estas solicitudes." });
        }

        const requests = grupo.solicitudesIngreso || [];
        const users = await Usuario.find({
            correoInstitucional: { $in: requests.map((request) => request.correoInstitucional) },
        }).select("nombre avatar correoInstitucional").lean();
        const userByEmail = new Map(users.map((user) => [user.correoInstitucional.toLowerCase(), user]));
        return res.json(requests.map((request) => {
            const email = request.correoInstitucional;
            const user = userByEmail.get(email.toLowerCase());
            return {
                correoInstitucional: email,
                nombre: user?.nombre || email.split("@")[0],
                avatar: toPublicUploadUrl(req, "avatars", user?.avatar),
                createdAt: request.createdAt,
            };
        }));
    } catch (error) {
        console.error("Error al listar solicitudes de ingreso:", error);
        return res.status(500).json({ message: "No se pudieron cargar las solicitudes." });
    }
};

export const responderSolicitudIngreso = async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Comunidad no encontrada." });
        const correo = req.usuario?.correoInstitucional;
        if (grupo.creadorEmail !== correo && req.usuario?.rol !== "administrador") {
            return res.status(403).json({ message: "Solo el creador puede responder solicitudes." });
        }

        const email = String(req.body?.correoInstitucional || "").trim().toLowerCase();
        const action = String(req.body?.action || "").toLowerCase();
        if (!email || !["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "Solicitud o acción inválida." });
        }
        const isPending = (groupRequest) => groupRequest.correoInstitucional?.toLowerCase() === email;
        if (!(grupo.solicitudesIngreso || []).some(isPending)) {
            return res.status(404).json({ message: "La solicitud ya fue atendida." });
        }
        if (action === "accept") {
            if (grupo.archivado) return res.status(409).json({ message: "No se puede aceptar solicitudes en una comunidad archivada." });
            if (!(grupo.miembrosArray || []).some((member) => member.toLowerCase() === email)) {
                grupo.miembrosArray.push(email);
            }
        }
        grupo.solicitudesIngreso = (grupo.solicitudesIngreso || []).filter((request) => !isPending(request));
        await grupo.save();
        return res.json({ message: action === "accept" ? "La persona ya pertenece a la comunidad." : "Solicitud eliminada." });
    } catch (error) {
        console.error("Error al responder solicitud de ingreso:", error);
        return res.status(500).json({ message: "No se pudo procesar la solicitud." });
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

const esMiembroDelGrupo = (grupo, correo, rol) =>
    rol === "administrador" || perteneceAlGrupo(grupo, correo);

export const listarMiembros = async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });
        if (grupo.archivado && req.usuario?.rol !== "administrador" && grupo.creadorEmail !== req.usuario?.correoInstitucional) {
            return res.status(404).json({ message: "Comunidad no encontrada" });
        }

        const usuarios = await Usuario.find({
            correoInstitucional: { $in: grupo.miembrosArray || [] },
        }).select("_id nombre avatar correoInstitucional universidad carrera");

        const porCorreo = new Map(
            usuarios.map((user) => [user.correoInstitucional, {
                _id: user._id,
                nombre: user.nombre,
                avatar: toPublicUploadUrl(req, "avatars", user.avatar),
                correoInstitucional: user.correoInstitucional,
                universidad: user.universidad,
                carrera: user.carrera,
            }])
        );

        const miembros = (grupo.miembrosArray || []).map((correo) =>
            porCorreo.get(correo) || {
                _id: correo,
                nombre: correo.split("@")[0],
                avatar: "",
                correoInstitucional: correo,
                universidad: "",
                carrera: "",
            }
        );

        res.json(miembros);
    } catch (error) {
        res.status(400).json({ message: "Error al listar miembros" });
    }
};

export const eliminarMiembro = async (req, res) => {
    try {
        const correoSolicitante = req.usuario?.correoInstitucional;
        if (!correoSolicitante) return res.status(401).json({ message: "No autenticado" });

        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Comunidad no encontrada" });
        const esCreador = grupo.creadorEmail === correoSolicitante;
        const esAdministrador = req.usuario?.rol === "administrador";
        if (!esCreador && !esAdministrador) {
            return res.status(403).json({ message: "Solo el creador o un administrador pueden eliminar miembros." });
        }

        const correoMiembro = String(req.body?.correoInstitucional || "").trim().toLowerCase();
        if (!correoMiembro || correoMiembro === String(grupo.creadorEmail).toLowerCase()) {
            return res.status(400).json({ message: "No se puede eliminar al creador de la comunidad." });
        }
        const miembroActual = (grupo.miembrosArray || []).some((correo) => String(correo).toLowerCase() === correoMiembro);
        if (!miembroActual) return res.status(404).json({ message: "La persona ya no pertenece a esta comunidad." });

        grupo.miembrosArray = grupo.miembrosArray.filter((correo) => String(correo).toLowerCase() !== correoMiembro);
        await grupo.save();
        return res.json({ message: "Miembro eliminado de la comunidad." });
    } catch (error) {
        console.error("Error al eliminar miembro:", error);
        return res.status(500).json({ message: "No se pudo eliminar al miembro." });
    }
};

export const invitarMiembro = async (req, res) => {
    try {
        const correoInvitador = req.usuario?.correoInstitucional;
        if (!correoInvitador) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        if (!esMiembroDelGrupo(grupo, correoInvitador, req.usuario?.rol)) {
            return res.status(403).json({ message: "Solo los miembros pueden invitar." });
        }
        if (grupo.archivado) return res.status(409).json({ message: "No se pueden enviar invitaciones a una comunidad archivada." });

        const { userId, correo } = req.body || {};
        let email = typeof correo === "string" ? correo.trim().toLowerCase() : "";

        if (userId) {
            const usuario = await Usuario.findById(userId);
            if (!usuario?.correoInstitucional) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            email = usuario.correoInstitucional;

            if (grupo.miembrosArray.includes(email)) {
                return res.status(400).json({ message: "Esa persona ya es miembro del grupo." });
            }

            const alreadyInvited = (usuario.grupoInvitaciones || []).some(
                (item) => item.grupo?.toString() === grupo._id.toString()
            );
            if (alreadyInvited) {
                return res.status(400).json({ message: "Ya tiene una invitación pendiente." });
            }

            usuario.grupoInvitaciones = [
                ...(usuario.grupoInvitaciones || []),
                { grupo: grupo._id, fromUser: req.usuario._id, createdAt: new Date() },
            ];
            await usuario.save({ validateModifiedOnly: true });
            return res.json({ message: `Invitación enviada a ${usuario.nombre}.` });
        }

        if (!email) {
            return res.status(400).json({ message: "Selecciona un usuario para invitar." });
        }

        if (grupo.miembrosArray.includes(email)) {
            return res.status(400).json({ message: "Esa persona ya es miembro del grupo." });
        }

        const usuarioPorCorreo = await Usuario.findOne({ correoInstitucional: email });
        if (!usuarioPorCorreo) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        const alreadyInvited = (usuarioPorCorreo.grupoInvitaciones || []).some(
            (item) => item.grupo?.toString() === grupo._id.toString()
        );
        if (alreadyInvited) {
            return res.status(400).json({ message: "Ya tiene una invitación pendiente." });
        }
        usuarioPorCorreo.grupoInvitaciones = [
            ...(usuarioPorCorreo.grupoInvitaciones || []),
            { grupo: grupo._id, fromUser: req.usuario._id, createdAt: new Date() },
        ];
        await usuarioPorCorreo.save({ validateModifiedOnly: true });
        res.json({ message: `Invitación enviada a ${usuarioPorCorreo.nombre}.` });
    } catch (error) {
        res.status(400).json({ message: "Error al invitar" });
    }
};

export const listarInvitacionesGrupo = async (req, res) => {
    try {
        const me = await Usuario.findById(req.usuario._id)
            .select("grupoInvitaciones")
            .populate("grupoInvitaciones.grupo", "nombre imagen descripcion miembrosArray tags")
            .populate("grupoInvitaciones.fromUser", "nombre avatar")
            .lean();

        const items = (me?.grupoInvitaciones || [])
            .filter((item) => item.grupo?._id)
            .map((item) => {
                const grupo = mapGroupMedia(req, item.grupo);
                const fromUser = item.fromUser
                    ? {
                        _id: item.fromUser._id,
                        nombre: item.fromUser.nombre,
                        avatar: toPublicUploadUrl(req, "avatars", item.fromUser.avatar),
                    }
                    : null;
                return {
                    _id: `ginv-${grupo._id}`,
                    type: "group_invite",
                    grupo,
                    fromUser,
                    message: `${fromUser?.nombre || "Alguien"} te invitó al grupo ${grupo.nombre}`,
                    createdAt: item.createdAt || new Date(),
                };
            });

        res.json(items);
    } catch {
        res.status(500).json({ message: "Error al listar invitaciones" });
    }
};

export const responderInvitacionGrupo = async (req, res) => {
    try {
        const { grupoId } = req.params;
        const action = String(req.body?.action || "").toLowerCase();
        const correo = req.usuario?.correoInstitucional;
        if (!correo) return res.status(401).json({ message: "No autenticado" });
        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "Acción inválida." });
        }

        const me = await Usuario.findById(req.usuario._id);
        if (!me) return res.status(404).json({ message: "Usuario no encontrado" });

        const tieneInvitacion = (me.grupoInvitaciones || []).some(
            (item) => item.grupo?.toString() === String(grupoId)
        );
        if (!tieneInvitacion) {
            return res.status(404).json({ message: "No tienes una invitación pendiente." });
        }

        if (action === "accept") {
            const grupo = await Grupo.findById(grupoId);
            if (!grupo) {
                me.grupoInvitaciones = (me.grupoInvitaciones || []).filter(
                    (item) => item.grupo?.toString() !== String(grupoId)
                );
                await me.save({ validateModifiedOnly: true });
                return res.status(404).json({ message: "El grupo ya no existe." });
            }
            if (grupo.archivado) {
                return res.status(409).json({ message: "No puedes unirte a una comunidad archivada." });
            }
            if (!grupo.miembrosArray.includes(correo)) {
                grupo.miembrosArray.push(correo);
                await grupo.save();
            }
        }

        me.grupoInvitaciones = (me.grupoInvitaciones || []).filter(
            (item) => item.grupo?.toString() !== String(grupoId)
        );
        await me.save({ validateModifiedOnly: true });
        res.json({
            message: action === "accept" ? "Te uniste al grupo." : "Invitación rechazada.",
        });
    } catch {
        res.status(400).json({ message: "Error al responder la invitación" });
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
        if (grupo.archivado) return res.status(409).json({ message: "Esta comunidad está archivada." });
        if (!perteneceAlGrupo(grupo, req.usuario?.correoInstitucional)) {
            return res.status(403).json({ message: "Solo los miembros pueden publicar en esta comunidad." });
        }

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
        if (grupo.archivado) return res.status(409).json({ message: "Esta comunidad está archivada." });
        if (!perteneceAlGrupo(grupo, req.usuario?.correoInstitucional)) {
            return res.status(403).json({ message: "Solo los miembros pueden comentar en esta comunidad." });
        }

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
        if (grupo.archivado) return res.status(409).json({ message: "Esta comunidad está archivada." });

        const post = grupo.posts.id(postId);
        if (!post) return res.status(404).json({ message: "Post no encontrado" });

        const correo = req.usuario?.correoInstitucional || "";
        const rol = req.usuario?.rol || "";
        const esAdminGlobal = rol === "administrador";
        const esCreador = String(grupo.creadorEmail).toLowerCase() === correo.toLowerCase();
        const puedeEliminar = (perteneceAlGrupo(grupo, correo) && post.autorEmail === correo) || esCreador || esAdminGlobal;

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
        const esCreador = String(grupo.creadorEmail).toLowerCase() === correo.toLowerCase();
        const puedeEliminar =
            (perteneceAlGrupo(grupo, correo) && (comentario.autorEmail === correo || post.autorEmail === correo)) ||
            esCreador ||
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
