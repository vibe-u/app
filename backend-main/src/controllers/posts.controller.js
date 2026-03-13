import Post from "../models/Post.js";

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
    const { texto, imagen } = req.body;

    const post = new Post({
      usuario: req.usuario._id,
      texto,
      imagen,
    });

    await post.save();
    await post.populate("usuario", "nombre avatar correoInstitucional");

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
