import Evento from "../models/Evento.js";
import Grupo from "../models/Grupos.js";
import Post from "../models/Post.js";
import { toPublicUploadUrl } from "../utils/mediaUrl.js";
import {
  sanitizeInterests,
} from "../utils/interests.js";
import { scoreSemanticAffinity } from "../utils/semanticSimilarity.js";

const toId = (value) => value?.toString?.() || "";

const uniqueById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = toId(item?._id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const scoreRecommendation = (interests, profileText, activityText, itemText) => {
  const candidates = [
    {
      source: "Interés elegido",
      match: scoreSemanticAffinity(interests, "", itemText),
    },
    {
      source: "Tu perfil",
      match: scoreSemanticAffinity([], profileText, itemText),
    },
  ];

  if (activityText) {
    candidates.push({
      source: "Tus publicaciones o comentarios",
      match: scoreSemanticAffinity([], activityText, itemText),
    });
  }

  const bestMatch = candidates.reduce((best, candidate) =>
    candidate.match.affinity > best.match.affinity ? candidate : best
  );
  const concepts = bestMatch.match.reasons.map((reason) =>
    reason.replace(/^Afinidad con tus intereses:\s*/i, "")
  );
  const reasons = bestMatch.match.affinity > 0
    ? concepts.length
      ? concepts.slice(0, 1).map((concept) => `${bestMatch.source}: ${concept}`)
      : [`Coincidencia de términos con ${bestMatch.source.toLowerCase()}`]
    : [];

  return { affinity: bestMatch.match.affinity, reasons };
};

export const obtenerRecomendaciones = async (req, res) => {
  try {
    const user = req.usuario || {};
    const meId = toId(user._id);
    const email = user.correoInstitucional || "";
    const universidad = String(user.universidad || "").trim();
    const explicit = sanitizeInterests(user.intereses);
    const profileText = `${user.carrera || ""} ${user.descripcion || ""}`;
    const [grupos, eventos, publicaciones, actividad] = await Promise.all([
      Grupo.find({ archivado: { $ne: true } })
        .select("nombre imagen descripcion miembrosArray creadorEmail tags createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      universidad
        ? Evento.find({ universidad, fechaHora: { $gte: new Date() } })
            .populate("creador", "_id nombre avatar")
            .sort({ fechaHora: 1 })
            .lean()
        : [],
      Post.find({ "moderation.status": { $ne: "disabled" } })
        .populate("usuario", "_id nombre avatar")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Post.find({
        $or: [
          { usuario: user._id },
          { "comentarios.usuarioId": user._id },
        ],
      })
        .select("texto comentarios")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const activityText = actividad
      .flatMap((post) => [
        post.usuario?.toString?.() === meId ? post.texto : "",
        ...(post.comentarios || [])
          .filter((comment) => toId(comment.usuarioId) === meId)
          .map((comment) => comment.texto),
      ])
      .filter(Boolean)
      .join(" ")
      .slice(0, 6000);
    const hasSemanticProfile =
      explicit.length > 0 || Boolean(profileText.trim()) || Boolean(activityText);

    const scoredGrupos = grupos
      .filter((grupo) => !(grupo.miembrosArray || []).includes(email))
      .map((grupo) => {
        const semantic = scoreRecommendation(
          explicit,
          profileText,
          activityText,
          `${grupo.nombre || ""} ${grupo.descripcion || ""} ${(grupo.tags || []).join(" ")}`
        );
        const score = semantic.affinity * 100;
        return {
          _id: grupo._id,
          nombre: grupo.nombre,
          descripcion: grupo.descripcion || "",
          imagen: grupo.imagen || "",
          miembrosCount: (grupo.miembrosArray || []).length,
          miembrosArray: grupo.miembrosArray || [],
          creadorEmail: grupo.creadorEmail,
          reasons: semantic.reasons.length
            ? semantic.reasons
            : ["Comunidad activa"],
          affinity: Math.round(score),
        };
      })
      .filter((grupo) => !hasSemanticProfile || grupo.affinity > 0)
      .sort((a, b) => b.affinity - a.affinity || b.miembrosCount - a.miembrosCount);

    const scoredEventos = eventos
      .filter((evento) => !(evento.asistentes || []).some((id) => toId(id) === meId))
      .map((evento) => {
        const semantic = scoreRecommendation(
          explicit,
          profileText,
          activityText,
          `${evento.nombreEvento || ""} ${evento.descripcionEvento || ""} ${evento.lugar || ""} ${(evento.tags || []).join(" ")}`
        );
        const reasons = semantic.reasons.length
          ? semantic.reasons
          : universidad
              ? ["Actividad próxima en tu universidad"]
              : ["Evento recomendado para descubrir"];
        return {
          _id: evento._id,
          nombreEvento: evento.nombreEvento,
          portada: toPublicUploadUrl(req, "events", evento.portada),
          fechaHora: evento.fechaHora,
          lugar: evento.lugar,
          descripcionEvento: evento.descripcionEvento,
          costo: evento.costo,
          universidad: evento.universidad,
          asistentesCount: (evento.asistentes || []).length,
          reasons,
          affinity: Math.round(semantic.affinity * 100),
        };
      })
      .filter((evento) => !hasSemanticProfile || evento.affinity > 0)
      .sort((a, b) => b.affinity - a.affinity || new Date(a.fechaHora) - new Date(b.fechaHora));

    const scoredPosts = publicaciones
      .filter((post) => toId(post.usuario?._id) !== meId)
      .map((post) => {
        const commentText = (post.comentarios || []).map((comment) => comment.texto || "").join(" ");
        const semantic = scoreRecommendation(
          explicit,
          profileText,
          activityText,
          `${post.texto || ""} ${commentText}`
        );
        return {
          _id: post._id,
          texto: post.texto || "",
          imagen: toPublicUploadUrl(req, "posts", post.imagen),
          video: toPublicUploadUrl(req, "posts", post.video),
          autor: post.usuario?.nombre || "Usuario",
          avatar: toPublicUploadUrl(req, "avatars", post.usuario?.avatar),
          comentariosCount: (post.comentarios || []).length,
          createdAt: post.createdAt,
          reasons: semantic.reasons.length
            ? semantic.reasons
            : ["Publicación reciente para descubrir"],
          affinity: Math.round(semantic.affinity * 100),
        };
      })
      .filter((post) => !hasSemanticProfile || post.affinity > 0)
      .sort((a, b) => b.affinity - a.affinity || new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      intereses: explicit,
      hasInterests: explicit.length > 0,
      hasActivity: Boolean(activityText),
      needsUniversity: !universidad,
      grupos: uniqueById(scoredGrupos).slice(0, 6),
      eventos: uniqueById(scoredEventos).slice(0, 6),
      publicaciones: uniqueById(scoredPosts).slice(0, 5),
    });
  } catch (error) {
    console.error("Error al obtener recomendaciones semánticas:", error);
    res.status(500).json({ msg: "Error al obtener recomendaciones" });
  }
};
