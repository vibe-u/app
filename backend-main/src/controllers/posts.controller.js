import Post from "../models/Post.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "posts");

export const obtenerPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("usuario", "nombre avatar correoInstitucional")
      .sort({ createdAt: -1 });

    res.json(posts);
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
      imagen,
      video,
    });

    await post.save();
    await post.populate("usuario", "nombre avatar correoInstitucional");

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadPostMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No se envio archivo" });

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

    const baseUrl = process.env.URL_BACKEND || "http://localhost:3000";
    const url = `${baseUrl}/uploads/posts/${filename}`;
    res.status(201).json({
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

    res.json(post);
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
    res.json(post);
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
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
