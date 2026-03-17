import axios from "./axios";
import { isTokenExpired } from "../utils/authToken";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    throw new Error("Sesion expirada");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const searchRegisteredUsers = (query = "") =>
  axios.get(`/usuarios/buscar?query=${encodeURIComponent(query)}`, getAuthConfig());

export const getPublicUserProfile = (userId) =>
  axios.get(`/usuarios/publico/${userId}`, getAuthConfig());

export const sendFriendRequest = (toUserId) =>
  axios.post("/usuarios/amistad/solicitar", { toUserId }, getAuthConfig());

export const respondFriendRequest = (fromUserId, action) =>
  axios.post("/usuarios/amistad/responder", { fromUserId, action }, getAuthConfig());

export const getFriendNotifications = () =>
  axios.get("/usuarios/amistad/notificaciones", getAuthConfig());
