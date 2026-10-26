import mongoose from "mongoose";
import Grupo from "../models/Grupos.js";
import Usuario from "../models/Usuario.js";

const postKeyFor = (groupId, postId) => `${groupId}:${postId}`;

export const listarPublicacionesGuardadas = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select("savedPosts").lean();
    if (!usuario) return res.status(404).json({ msg: "No se encontró la cuenta." });
    res.json(usuario.savedPosts || []);
  } catch (error) {
    console.error("Error al consultar publicaciones guardadas:", error);
    res.status(500).json({ msg: "No se pudieron cargar las publicaciones guardadas." });
  }
};

export const togglePublicacionGuardada = async (req, res) => {
  try {
    const { groupId, postId } = req.body || {};
    if (!groupId || !postId) {
      return res.status(400).json({ msg: "Falta identificar la comunidad o publicación." });
    }
    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ msg: "La comunidad o publicación indicada no es válida." });
    }

    const grupo = await Grupo.findById(groupId).select("nombre posts");
    if (!grupo) return res.status(404).json({ msg: "La comunidad ya no está disponible." });
    const post = grupo.posts.id(postId);
    if (!post) return res.status(404).json({ msg: "La publicación ya no está disponible." });

    const postKey = postKeyFor(groupId, postId);
    const existing = await Usuario.exists({
      _id: req.usuario._id,
      "savedPosts.postKey": postKey,
    });

    if (existing) {
      await Usuario.updateOne(
        { _id: req.usuario._id },
        { $pull: { savedPosts: { postKey } } }
      );
      return res.json({ saved: false, postKey });
    }

    const savedPost = {
      postKey,
      groupId: grupo._id,
      groupName: grupo.nombre,
      postId: post._id,
      autor: post.autor || "Usuario",
      contenido: post.contenido || "",
      foto: post.foto || "",
      savedAt: new Date(),
    };

    await Usuario.updateOne(
      { _id: req.usuario._id },
      { $push: { savedPosts: savedPost } }
    );
    res.json({ saved: true, post: savedPost });
  } catch (error) {
    console.error("Error al guardar publicación:", error);
    res.status(500).json({ msg: "No se pudo guardar la publicación. Inténtalo de nuevo." });
  }
};
