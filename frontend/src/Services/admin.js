import axios from "./axios";
import { getSessionToken, isTokenExpired } from "../utils/authToken";

const getAuthConfig = () => {
  const token = getSessionToken();
  if (!token || isTokenExpired(token)) {
    throw new Error("Sesion expirada");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getModerationPosts = () =>
  axios.get("/admins/posts/moderacion", getAuthConfig());

export const runModerationAiBatch = () =>
  axios.post("/admins/posts/moderacion/analizar", {}, getAuthConfig());

export const runModerationAiSingle = (postId) =>
  axios.post(`/admins/posts/moderacion/${postId}/analizar`, {}, getAuthConfig());

export const disableModeratedPost = (postId, reason) =>
  axios.put(`/admins/posts/moderacion/${postId}/desactivar`, { reason }, getAuthConfig());

export const enableModeratedPost = (postId) =>
  axios.put(`/admins/posts/moderacion/${postId}/reactivar`, {}, getAuthConfig());

export const setUserSuspension = (userId, suspendido, motivo = "") =>
  axios.put(`/admins/usuarios/${userId}/suspension`, { suspendido, motivo }, getAuthConfig());

export const getAdminAuditLog = () =>
  axios.get("/admins/bitacora", getAuthConfig());

export const downloadAdminAuditLog = () =>
  axios.get("/admins/bitacora/exportar", {
    ...getAuthConfig(),
    responseType: "blob",
  });

export const getPendingContentReports = () =>
  axios.get("/admins/reportes", getAuthConfig());

export const reviewContentReport = (reportId, status) =>
  axios.patch(`/admins/reportes/${reportId}`, { status }, getAuthConfig());

export const getPendingDeletionRequests = () =>
  axios.get("/admins/solicitudes-eliminacion", getAuthConfig());

export const reviewDeletionRequest = (requestId, status, reviewNote = "") =>
  axios.patch(`/admins/solicitudes-eliminacion/${requestId}`, { status, reviewNote }, getAuthConfig());

export const getAdminWorkflowNotifications = () =>
  axios.get("/admins/notificaciones", getAuthConfig());
