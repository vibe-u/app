import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Post from "../models/Post.js";
import Grupo from "../models/Grupos.js";
import { mapAvatarToPublicUrl, mapPostMediaToPublicUrl } from "../utils/mediaUrl.js";

const PUBLIC_USER_FIELDS = "nombre avatar descripcion universidad carrera rol correoInstitucional";

const removeId = (arr = [], id) => arr.filter((item) => item.toString() !== id.toString());

const getFriendStatus = (viewer, targetId) => {
  const meId = viewer._id.toString();
  const tId = targetId.toString();
  if (meId === tId) return "self";
  if ((viewer.amigos || []).some((id) => id.toString() === tId)) return "friends";
  if ((viewer.solicitudesEnviadas || []).some((id) => id.toString() === tId)) return "pending_sent";
  if ((viewer.solicitudesRecibidas || []).some((id) => id.toString() === tId)) return "pending_received";
  return "none";
};

const searchUsers = async (req, res) => {
  try {
    const query = (req.query.query || "").trim();
    if (!query) return res.json([]);

    const users = await Usuario.find({
      _id: { $ne: req.usuario._id },
      confirmEmail: true,
      nombre: { $regex: `^${query}`, $options: "i" },
    })
      .select("_id nombre avatar universidad carrera")
      .limit(8)
      .lean();

    res.json(users.map((user) => mapAvatarToPublicUrl(req, user)));
  } catch {
    res.status(500).json({ msg: "Error al buscar usuarios" });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Usuario invalido" });
    }

    const [viewer, user] = await Promise.all([
      Usuario.findById(req.usuario._id)
        .select("amigos solicitudesEnviadas solicitudesRecibidas")
        .lean(),
      Usuario.findById(id).select(PUBLIC_USER_FIELDS).lean(),
    ]);

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const [posts, groups] = await Promise.all([
      Post.find({ usuario: id, "moderation.status": { $ne: "disabled" } })
        .populate("usuario", "nombre avatar")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Grupo.find({
        $or: [{ creadorEmail: user.correoInstitucional }, { miembrosArray: user.correoInstitucional }],
      })
        .select("_id nombre imagen creadorEmail miembrosArray")
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const mappedPosts = posts.map((post) => mapPostMediaToPublicUrl(req, post));

    res.json({
      user: {
        _id: user._id,
        nombre: user.nombre,
        avatar: mapAvatarToPublicUrl(req, user).avatar,
        descripcion: user.descripcion,
        universidad: user.universidad,
        carrera: user.carrera,
        rol: user.rol,
      },
      friendStatus: getFriendStatus(viewer, user._id),
      posts: mappedPosts,
      groups,
    });
  } catch {
    res.status(500).json({ msg: "Error al obtener perfil publico" });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ msg: "Usuario invalido" });
    }
    if (toUserId === req.usuario._id.toString()) {
      return res.status(400).json({ msg: "No puedes enviarte solicitud" });
    }

    const [fromUser, toUser] = await Promise.all([
      Usuario.findById(req.usuario._id),
      Usuario.findById(toUserId),
    ]);

    if (!toUser) return res.status(404).json({ msg: "Usuario no encontrado" });

    const alreadyFriends = (fromUser.amigos || []).some((id) => id.toString() === toUserId);
    if (alreadyFriends) return res.status(400).json({ msg: "Ya son amigos" });

    const alreadySent = (fromUser.solicitudesEnviadas || []).some((id) => id.toString() === toUserId);
    if (alreadySent) return res.status(400).json({ msg: "Solicitud ya enviada" });

    fromUser.solicitudesEnviadas = [...(fromUser.solicitudesEnviadas || []), toUser._id];
    toUser.solicitudesRecibidas = [...(toUser.solicitudesRecibidas || []), fromUser._id];

    await Promise.all([fromUser.save(), toUser.save()]);
    res.json({ msg: "Solicitud enviada", friendStatus: "pending_sent" });
  } catch {
    res.status(500).json({ msg: "Error al enviar solicitud" });
  }
};

const respondFriendRequest = async (req, res) => {
  try {
    const { fromUserId, action } = req.body;
    if (!mongoose.Types.ObjectId.isValid(fromUserId)) {
      return res.status(400).json({ msg: "Usuario invalido" });
    }
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ msg: "Accion invalida" });
    }

    const [me, fromUser] = await Promise.all([
      Usuario.findById(req.usuario._id),
      Usuario.findById(fromUserId),
    ]);
    if (!fromUser) return res.status(404).json({ msg: "Usuario no encontrado" });

    const hadRequest = (me.solicitudesRecibidas || []).some((id) => id.toString() === fromUserId);
    if (!hadRequest) return res.status(400).json({ msg: "No existe esa solicitud" });

    me.solicitudesRecibidas = removeId(me.solicitudesRecibidas, fromUserId);
    fromUser.solicitudesEnviadas = removeId(fromUser.solicitudesEnviadas, me._id);

    if (action === "accept") {
      if (!(me.amigos || []).some((id) => id.toString() === fromUserId)) {
        me.amigos = [...(me.amigos || []), fromUser._id];
      }
      if (!(fromUser.amigos || []).some((id) => id.toString() === me._id.toString())) {
        fromUser.amigos = [...(fromUser.amigos || []), me._id];
      }
    }

    await Promise.all([me.save(), fromUser.save()]);
    res.json({
      msg: action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada",
      friendStatus: action === "accept" ? "friends" : "none",
    });
  } catch {
    res.status(500).json({ msg: "Error al responder solicitud" });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { friendUserId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(friendUserId)) {
      return res.status(400).json({ msg: "Usuario invalido" });
    }

    const [me, friendUser] = await Promise.all([
      Usuario.findById(req.usuario._id),
      Usuario.findById(friendUserId),
    ]);

    if (!friendUser) return res.status(404).json({ msg: "Usuario no encontrado" });

    const areFriends = (me.amigos || []).some((id) => id.toString() === friendUserId);
    if (!areFriends) {
      return res.status(400).json({ msg: "No son amigos actualmente" });
    }

    me.amigos = removeId(me.amigos, friendUserId);
    friendUser.amigos = removeId(friendUser.amigos, me._id);

    me.solicitudesEnviadas = removeId(me.solicitudesEnviadas || [], friendUserId);
    me.solicitudesRecibidas = removeId(me.solicitudesRecibidas || [], friendUserId);
    friendUser.solicitudesEnviadas = removeId(friendUser.solicitudesEnviadas || [], me._id);
    friendUser.solicitudesRecibidas = removeId(friendUser.solicitudesRecibidas || [], me._id);

    await Promise.all([me.save(), friendUser.save()]);

    res.json({ msg: "Amistad eliminada", friendStatus: "none" });
  } catch {
    res.status(500).json({ msg: "Error al eliminar amigo" });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ msg: "Usuario invalido" });
    }

    const [me, toUser] = await Promise.all([
      Usuario.findById(req.usuario._id),
      Usuario.findById(toUserId),
    ]);

    if (!toUser) return res.status(404).json({ msg: "Usuario no encontrado" });

    const hadSentRequest = (me.solicitudesEnviadas || []).some((id) => id.toString() === toUserId);
    if (!hadSentRequest) {
      return res.status(400).json({ msg: "No tienes una solicitud enviada a este usuario" });
    }

    me.solicitudesEnviadas = removeId(me.solicitudesEnviadas, toUserId);
    toUser.solicitudesRecibidas = removeId(toUser.solicitudesRecibidas, me._id);

    await Promise.all([me.save(), toUser.save()]);

    res.json({ msg: "Solicitud cancelada", friendStatus: "none" });
  } catch {
    res.status(500).json({ msg: "Error al cancelar solicitud" });
  }
};

const getFriendRequestNotifications = async (req, res) => {
  try {
    const me = await Usuario.findById(req.usuario._id)
      .populate("solicitudesRecibidas", "_id nombre avatar universidad carrera")
      .lean();

    const notifications = (me?.solicitudesRecibidas || []).map((user) => ({
      _id: `fr-${user._id}`,
      type: "friend_request",
      fromUser: mapAvatarToPublicUrl(req, user),
      message: `${user.nombre} te envio una solicitud de amistad`,
      createdAt: new Date().toISOString(),
    }));

    res.json(notifications);
  } catch {
    res.status(500).json({ msg: "Error al obtener notificaciones" });
  }
};

export {
  searchUsers,
  getPublicProfile,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  cancelFriendRequest,
  getFriendRequestNotifications,
};
