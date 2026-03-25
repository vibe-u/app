const trimEndSlash = (value = "") => value.replace(/\/+$/, "");

const isLocalhostUrl = (value = "") => /localhost|127\.0\.0\.1/i.test(value);

export const getPublicBaseUrl = (req) => {
  const configured = trimEndSlash(process.env.URL_BACKEND || "");
  if (configured && !isLocalhostUrl(configured)) return configured;

  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];

  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;

  if (host) {
    return `${proto || req.protocol}://${host}`;
  }

  return `${req.protocol}://${req.get("host")}`;
};
