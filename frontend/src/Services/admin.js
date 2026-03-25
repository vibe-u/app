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
