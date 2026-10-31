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

export const getGroupInvites = () => axios.get("/grupos/invitaciones", getAuthConfig());

export const getArchivedGroups = () => axios.get("/grupos/archivados", getAuthConfig());

export const setGroupArchived = (groupId, archivado) =>
  axios.patch(`/grupos/${groupId}/archivar`, { archivado }, getAuthConfig());

export const respondGroupInvite = (grupoId, action) =>
  axios.post(`/grupos/invitaciones/${grupoId}/responder`, { action }, getAuthConfig());
