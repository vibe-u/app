import Post from "../models/Post.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPublicBaseUrl } from "../utils/publicBaseUrl.js";
import { toStoredUploadRef, mapPostMediaToPublicUrl } from "../utils/mediaUrl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "posts");

export const obtenerPosts = async (req, res) => {
  try {
    const pageRaw = Number(req.query?.page);
    const limitRaw = Number(req.query?.limit);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 50) : 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ "moderation.status": { $ne: "disabled" } })
      .populate("usuario", "nombre avatar correoInstitucional")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const payload = posts.map((post) => mapPostMediaToPublicUrl(req, post.toObject()));
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const crearPost = async (req, res) => {
  try {
    const { texto, imagen, video } = req.body;

    const post = new Post({
      usuario: req.usuario._id,
      texto,
      imagen: toStoredUploadRef(imagen, "posts"),
      video: toStoredUploadRef(video, "posts"),
      moderation: {
        status: "active",
        aiVerdict: "apto",
        aiScore: 0,
        aiReasons: [],
      },
    });

    await post.save();
    await post.populate("usuario", "nombre avatar correoInstitucional");

    res.status(201).json(mapPostMediaToPublicUrl(req, post.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadPostMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400 ).json({ message: "No se envio archivo" });

    const mime = req.file.mimetype || "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    if (!isImage && !isVideo) {
      return res.status(400).json({ message: "Solo se permiten imagenes o videos" });
    }

    fs.mkdirSync(POSTS_UPLOAD_DIR, { recursive: true });
    const originalExt = path.extname(req.file.originalname || "").toLowerCase();
    const fallbackExt = isVideo ? ".mp4" : ".jpg";
    const ext = originalExt || fallbackExt;
    const filename = `media-${req.usuario._id}-${Date.now()}${ext}`;
    const fullPath = path.join(POSTS_UPLOAD_DIR, filename);
    fs.writeFileSync(fullPath, req.file.buffer);

    const baseUrl = getPublicBaseUrl(req);
    const url = `${baseUrl}/uploads/posts/${filename}`;
    res.status(201).json({
      filename,
      url,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("usuario", "nombre avatar correoInstitucional");
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    const meId = req.usuario._id.toString();
    const alreadyLiked = (post.likedBy || []).some((id) => id.toString() === meId);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== meId);
    } else {
      post.likedBy = [...(post.likedBy || []), req.usuario._id];
    }

    post.likes = post.likedBy.length;
    await post.save();

    res.json(mapPostMediaToPublicUrl(req, post.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const comentarPost = async (req, res) => {
  try {
    const { texto } = req.body;
    const commentText = (texto || "").trim();
    if (!commentText) return res.status(400).json({ message: "El comentario no puede estar vacio" });

    const post = await Post.findById(req.params.id).populate("usuario", "nombre avatar correoInstitucional");
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    post.comentarios.push({
      texto: commentText,
      usuario: req.usuario.nombre || "Usuario",
      usuarioId: req.usuario._id,
    });

    await post.save();
    res.json(mapPostMediaToPublicUrl(req, post.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const eliminarPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    if (post.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: "No puedes eliminar este post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const eliminarComentarioPost = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id).populate("usuario", "nombre avatar correoInstitucional");
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    const comment = (post.comentarios || []).find((item) => item._id?.toString() === commentId);
    if (!comment) return res.status(404).json({ message: "Comentario no encontrado" });

    const isPostOwner = post.usuario?._id?.toString() === req.usuario._id.toString();
    const isCommentOwner = comment.usuarioId?.toString() === req.usuario._id.toString();

    if (!isPostOwner && !isCommentOwner) {
      return res.status(403).json({ message: "No puedes eliminar este comentario" });
    }

    post.comentarios = (post.comentarios || []).filter((item) => item._id?.toString() !== commentId);
    await post.save();
    res.json(mapPostMediaToPublicUrl(req, post.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getModerationNotifications = async (req, res) => {
  try {
    const posts = await Post.find({
      usuario: req.usuario._id,
      "moderation.notificationCreatedAt": { $ne: null },
    })
      .select("texto createdAt moderation")
      .sort({ "moderation.notificationCreatedAt": -1 })
      .limit(30)
      .lean();

    const notifications = posts.map((post) => {
      const status = post?.moderation?.status;
      const defaultMessage =
        status === "disabled"
          ? "Tu publicacion fue desactivada por moderacion."
          : "Tu publicacion fue revisada por moderacion.";
      return {
        _id: `moder-${post._id}-${post?.moderation?.notificationCreatedAt || post.createdAt}`,
        type: "moderation_alert",
        message: post?.moderation?.notificationMessage || defaultMessage,
        postId: post._id,
        status,
        createdAt: post?.moderation?.notificationCreatedAt || post.createdAt,
      };
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener notificaciones de moderacion" });
  }
};
