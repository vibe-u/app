import axios from "./axios";

export const obtenerPosts = () => axios.get("/posts");

export const crearPost = (data, token) =>
  axios.post("/posts", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
