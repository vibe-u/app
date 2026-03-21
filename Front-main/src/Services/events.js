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

export const getUniversityEvents = () => axios.get("/eventos", getAuthConfig());

export const createUniversityEvent = (payload) => axios.post("/eventos", payload, getAuthConfig());

export const updateUniversityEvent = (eventId, payload) =>
  axios.put(`/eventos/${eventId}`, payload, getAuthConfig());

export const deleteUniversityEvent = (eventId) => axios.delete(`/eventos/${eventId}`, getAuthConfig());

export const toggleAttendEvent = (eventId) => axios.post(`/eventos/${eventId}/asistire`, {}, getAuthConfig());

export const getEventNotifications = () => axios.get("/eventos/notificaciones", getAuthConfig());
