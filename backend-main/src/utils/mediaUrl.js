import { getPublicBaseUrl } from "./publicBaseUrl.js";

const hasHttpProtocol = (value = "") => /^https?:\/\//i.test(value);
const isLocalHostname = (hostname = "") => /^(localhost|127\.0\.0\.1)$/i.test(hostname);
const INVALID_STRING_VALUES = new Set(["null", "undefined", "nan", "false"]);

export const extractStoredFilename = (value) => {
  if (!value || typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (INVALID_STRING_VALUES.has(trimmed.toLowerCase())) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  try {
    if (hasHttpProtocol(trimmed)) {
      const pathname = new URL(trimmed).pathname || "";
      const parts = pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    }
  } catch {
    // continue with fallback split
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || trimmed;
};

export const toStoredUploadRef = (value, folder) => {
  if (!value || typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (INVALID_STRING_VALUES.has(trimmed.toLowerCase())) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  if (hasHttpProtocol(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const uploadsIndex = segments.findIndex((segment) => segment === "uploads");
      const isLocalOrUploads =
        isLocalHostname(parsed.hostname) ||
        (uploadsIndex >= 0 && segments[uploadsIndex + 1] === folder);
      if (!isLocalOrUploads) return trimmed;
    } catch {
      return trimmed;
    }
  }

  return extractStoredFilename(trimmed);
};

export const toPublicUploadUrl = (req, folder, value) => {
  if (!value || typeof value !== "string") return value || "";
  const trimmed = value.trim();
  if (!trimmed || INVALID_STRING_VALUES.has(trimmed.toLowerCase())) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  if (hasHttpProtocol(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (!isLocalHostname(parsed.hostname)) return trimmed;
    } catch {
      return trimmed;
    }
  }

  const filename = extractStoredFilename(trimmed);
  if (!filename) return "";
  return `${getPublicBaseUrl(req)}/uploads/${folder}/${filename}`;
};

export const mapAvatarToPublicUrl = (req, user = null) => {
  if (!user) return user;
  return {
    ...user,
    avatar: toPublicUploadUrl(req, "avatars", user.avatar),
  };
};

export const mapPostMediaToPublicUrl = (req, post = null) => {
  if (!post) return post;
  const mapped = {
    ...post,
    imagen: toPublicUploadUrl(req, "posts", post.imagen),
    video: toPublicUploadUrl(req, "posts", post.video),
  };

  if (mapped.usuario) {
    mapped.usuario = mapAvatarToPublicUrl(req, mapped.usuario);
  }

  return mapped;
};
