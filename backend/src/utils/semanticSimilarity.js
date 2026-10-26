import { normalizeText, sanitizeInterests } from "./interests.js";

const CONCEPTS = {
  desarrollo: {
    label: "desarrollo de software y tecnología",
    terms: ["programacion", "codigo", "software", "desarrollo", "aplicaciones", "computacion", "tecnologia", "algoritmos", "informatica", "datos", "inteligencia artificial", "robotica", "web", "digital"],
    interests: ["tecnologia", "ciencia"],
  },
  musica: {
    label: "música y expresión sonora",
    terms: ["musica", "canciones", "concierto", "banda", "instrumento", "guitarra", "canto", "vocal", "dj", "sonido", "festival"],
    interests: ["musica", "arte", "vida-social"],
  },
  movimiento: {
    label: "actividad física y deporte",
    terms: ["deporte", "futbol", "baloncesto", "basket", "voleibol", "natacion", "correr", "carrera", "entrenamiento", "ejercicio", "fitness", "atletismo", "tenis"],
    interests: ["deporte", "bienestar"],
  },
  creatividad: {
    label: "arte, diseño y creatividad",
    terms: ["arte", "diseno", "dibujo", "pintura", "fotografia", "cine", "teatro", "ilustracion", "creatividad", "visual", "audiovisual"],
    interests: ["arte", "musica"],
  },
  aprendizaje: {
    label: "aprendizaje y apoyo académico",
    terms: ["estudio", "aprendizaje", "tutoria", "clase", "curso", "matematicas", "fisica", "quimica", "academico", "investigacion", "laboratorio", "examen"],
    interests: ["estudio", "ciencia", "idiomas"],
  },
  idiomas: {
    label: "idiomas e intercambio cultural",
    terms: ["idioma", "ingles", "frances", "aleman", "portugues", "conversacion", "intercambio", "cultura", "traduccion", "internacional"],
    interests: ["idiomas", "vida-social"],
  },
  emprendimiento: {
    label: "emprendimiento y negocios",
    terms: ["emprendimiento", "negocio", "empresa", "startup", "marketing", "finanzas", "innovacion", "proyecto", "liderazgo", "ventas"],
    interests: ["emprendimiento", "tecnologia"],
  },
  comunidad: {
    label: "participación social y comunidad",
    terms: ["voluntariado", "comunidad", "ayuda", "social", "solidaridad", "ong", "inclusion", "servicio", "impacto", "colectivo"],
    interests: ["voluntariado", "vida-social"],
  },
  juegos: {
    label: "videojuegos y juegos competitivos",
    terms: ["videojuego", "juego", "gaming", "gamer", "esports", "minecraft", "fortnite", "consola", "competencia", "estrategia"],
    interests: ["gaming", "tecnologia", "vida-social"],
  },
  bienestar: {
    label: "salud y bienestar integral",
    terms: ["salud", "bienestar", "yoga", "meditacion", "nutricion", "mental", "emocional", "relajacion", "autocuidado", "mindfulness"],
    interests: ["bienestar", "deporte"],
  },
};

const tokenize = (value = "") =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

const stem = (token) =>
  token
    .replace(/(amientos|imientos|aciones|uciones|adores|adoras|mente|idades|ismos|istas|acion|ucion|ando|iendo|ados|idos|es|s)$/u, "")
    .slice(0, 12);

const addTokenVector = (vector, tokens, weight = 0.25) => {
  for (const token of tokens) {
    const root = stem(token);
    if (root) vector.set(`term:${root}`, (vector.get(`term:${root}`) || 0) + weight);
  }
};

const addConceptVector = (vector, text) => {
  const normalized = ` ${normalizeText(text)} `;
  const tokens = tokenize(text);
  for (const [conceptId, concept] of Object.entries(CONCEPTS)) {
    const hits = concept.terms.filter((term) => {
      const normalizedTerm = normalizeText(term);
      return normalized.includes(` ${normalizedTerm} `) || tokens.some((token) =>
        stem(token) === stem(normalizedTerm) && token.length > 4
      );
    }).length;
    if (hits) vector.set(`concept:${conceptId}`, Math.min(2, 1 + (hits - 1) * 0.2));
  }
  addTokenVector(vector, tokens);
};

const vectorForInterests = (interests, profileText) => {
  const vector = new Map();
  for (const id of sanitizeInterests(interests)) {
    for (const [conceptId, concept] of Object.entries(CONCEPTS)) {
      if (concept.interests.includes(id)) {
        vector.set(`concept:${conceptId}`, (vector.get(`concept:${conceptId}`) || 0) + 1);
      }
    }
  }
  addConceptVector(vector, profileText);
  return vector;
};

const cosineSimilarity = (left, right) => {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (const [key, value] of left) {
    leftMagnitude += value * value;
    dot += value * (right.get(key) || 0);
  }
  for (const value of right.values()) rightMagnitude += value * value;
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

export const scoreSemanticAffinity = (interests, profileText, itemText) => {
  const profile = vectorForInterests(interests, profileText);
  const item = new Map();
  addConceptVector(item, itemText);
  const affinity = cosineSimilarity(profile, item);
  const sharedConcepts = Object.entries(CONCEPTS)
    .filter(([id]) => profile.has(`concept:${id}`) && item.has(`concept:${id}`))
    .sort((a, b) =>
      (profile.get(`concept:${b[0]}`) * item.get(`concept:${b[0]}`)) -
      (profile.get(`concept:${a[0]}`) * item.get(`concept:${a[0]}`))
    )
    .slice(0, 3)
    .map(([, concept]) => concept.label);
  const reasons = sharedConcepts.length
    ? sharedConcepts.map((label) => `Afinidad con tus intereses: ${label}`)
    : affinity > 0
      ? ["Afinidad temática con tu perfil"]
      : [];
  return { affinity, reasons };
};
