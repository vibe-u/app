const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

export const getTokenPayload = (token) => decodeJwtPayload(token);

export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const getSessionToken = () => {
  if (typeof window === "undefined") return "";

  const directToken = localStorage.getItem("token");
  if (directToken && !isTokenExpired(directToken)) return directToken;

  try {
    const persistedRaw = localStorage.getItem("auth-token");
    if (!persistedRaw) return "";
    const persisted = JSON.parse(persistedRaw);
    const tokenFromStore = persisted?.state?.token || "";
    if (tokenFromStore && !isTokenExpired(tokenFromStore)) {
      localStorage.setItem("token", tokenFromStore);
      return tokenFromStore;
    }
    return "";
  } catch {
    return "";
  }
};
