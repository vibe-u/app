import Post from "../models/Post.js";

const RISK_KEYWORDS = {
  severe: [
    "amenaza",
    "matar",
    "suicidio",
    "violacion",
    "abuso",
    "droga",
    "drogas",
    "odio",
    "racista",
    "nazi",
    "porno",
    "desnudo",
    "nude",
  ],
  medium: [
    "idiota",
    "estupido",
    "imbecil",
    "puta",
    "mierda",
    "odio",
    "falso",
    "fraude",
    "estafa",
  ],
};

const normalize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ");

const analyzeTextWithHeuristicAi = (rawText = "") => {
  const text = normalize(rawText);
  if (!text.trim()) {
    return {
      score: 0,
      verdict: "apto",
      reasons: ["Sin texto para evaluar; se considera apto por defecto."],
    };
  }

  let score = 0;
  const reasons = [];

  for (const keyword of RISK_KEYWORDS.severe) {
    if (text.includes(keyword)) {
      score += 35;
      reasons.push(`Termino sensible detectado: "${keyword}"`);
    }
  }

  for (const keyword of RISK_KEYWORDS.medium) {
    if (text.includes(keyword)) {
      score += 12;
      reasons.push(`Lenguaje agresivo detectado: "${keyword}"`);
    }
  }

  if (text.length > 1200) {
    score += 10;
    reasons.push("Texto muy extenso; requiere validacion manual.");
  }

  const cappedScore = Math.min(100, score);
  const verdict = cappedScore >= 45 ? "no_apto" : "apto";

  return {
    score: cappedScore,
    verdict,
    reasons: reasons.length ? reasons : ["No se detectaron riesgos relevantes."],
  };
};

const mapModerationPayload = (post) => ({
  _id: post._id,
  texto: post.texto || "",
  imagen: post.imagen || "",
  video: post.video || "",
  createdAt: post.createdAt,
  usuario: post.usuario,
  moderation: post.moderation,
});

export const listarPostsModeracion = async (req, res) => {
  try {
    const status = (req.query.status || "").trim();
    const filter = {};
    if (status && ["active", "flagged", "disabled"].includes(status)) {
      filter["moderation.status"] = status;
    }

    const posts = await Post.find(filter)
      .populate("usuario", "nombre correoInstitucional avatar")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(posts.map(mapModerationPayload));
  } catch (error) {
    res.status(500).json({ msg: "Error al listar publicaciones para moderacion" });
  }
};

export const analizarPostsConIa = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(300);
    let flagged = 0;
    let aptos = 0;

    for (const post of posts) {
      const analysis = analyzeTextWithHeuristicAi(post.texto || "");
      const nextStatus = analysis.verdict === "no_apto" ? "flagged" : "active";
      if (nextStatus === "flagged") flagged += 1;
      else aptos += 1;

      post.moderation = {
        ...(post.moderation || {}),
        status: post.moderation?.status === "disabled" ? "disabled" : nextStatus,
        aiScore: analysis.score,
        aiVerdict: analysis.verdict,
        aiReasons: analysis.reasons,
        aiModel: "heuristic-v1",
        aiEvaluatedAt: new Date(),
      };
      await post.save();
    }

    res.json({
      msg: "Analisis IA ejecutado correctamente",
      total: posts.length,
      aptos,
      flagged,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al analizar publicaciones con IA" });
  }
};

export const analizarPostConIa = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Publicacion no encontrada" });

    const analysis = analyzeTextWithHeuristicAi(post.texto || "");
    const nextStatus = analysis.verdict === "no_apto" ? "flagged" : "active";

    post.moderation = {
      ...(post.moderation || {}),
      status: post.moderation?.status === "disabled" ? "disabled" : nextStatus,
      aiScore: analysis.score,
      aiVerdict: analysis.verdict,
      aiReasons: analysis.reasons,
      aiModel: "heuristic-v1",
      aiEvaluatedAt: new Date(),
    };
    await post.save();

    res.json({
      msg: "Publicacion analizada",
      postId: post._id,
      moderation: post.moderation,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al analizar publicacion" });
  }
};

export const desactivarPostModeracion = async (req, res) => {
  try {
    const reason = (req.body.reason || "").trim() || "Contenido no adecuado segun politicas.";
    const post = await Post.findById(req.params.id).populate("usuario", "nombre correoInstitucional");
    if (!post) return res.status(404).json({ msg: "Publicacion no encontrada" });

    post.moderation = {
      ...(post.moderation || {}),
      status: "disabled",
      reviewedBy: req.usuario._id,
      reviewedAt: new Date(),
      deactivationReason: reason,
      deactivatedAt: new Date(),
      notificationMessage: `Tu publicacion fue desactivada por moderacion. Motivo: ${reason}`,
      notificationCreatedAt: new Date(),
    };
    await post.save();

    res.json({ msg: "Publicacion desactivada y autor notificado", postId: post._id });
  } catch (error) {
    res.status(500).json({ msg: "Error al desactivar publicacion" });
  }
};

export const reactivarPostModeracion = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("usuario", "nombre correoInstitucional");
    if (!post) return res.status(404).json({ msg: "Publicacion no encontrada" });

    post.moderation = {
      ...(post.moderation || {}),
      status: "active",
      reviewedBy: req.usuario._id,
      reviewedAt: new Date(),
      deactivationReason: "",
      deactivatedAt: null,
      notificationMessage: "Tu publicacion fue reactivada por un administrador.",
      notificationCreatedAt: new Date(),
    };
    await post.save();

    res.json({ msg: "Publicacion reactivada y autor notificado", postId: post._id });
  } catch (error) {
    res.status(500).json({ msg: "Error al reactivar publicacion" });
  }
};
