const hasHttp = (value = "") => /^https?:\/\//i.test(value);
const isLocalHost = (hostname = "") => /^(localhost|127\.0\.0\.1)$/i.test(hostname);
const INVALID_STRING_VALUES = new Set(["null", "undefined", "nan", "false"]);
const DEFAULT_AVATAR = "/default-avatar.svg";

const normalizeBase = () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

export const resolveUploadUrl = (value, folder) => {
  if (!value || typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  if (INVALID_STRING_VALUES.has(raw.toLowerCase())) return "";
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  const base = normalizeBase();
  if (hasHttp(raw)) {
    try {
      const parsed = new URL(raw);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const uploadsIdx = segments.findIndex((item) => item === "uploads");
      if (uploadsIdx >= 0 && segments[uploadsIdx + 1] === folder) {
        const filename = segments[uploadsIdx + 2];
        if (filename && base) return `${base}/uploads/${folder}/${filename}`;
        return raw;
      }
      if (isLocalHost(parsed.hostname) && base) {
        const filename = segments.pop();
        if (filename) return `${base}/uploads/${folder}/${filename}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  if (!base) return raw;
  const filename = raw.replace(/\\/g, "/").split("/").filter(Boolean).pop() || raw;
  return `${base}/uploads/${folder}/${filename}`;
};

export const resolveAvatarUrl = (value) => resolveUploadUrl(value, "avatars") || DEFAULT_AVATAR;
