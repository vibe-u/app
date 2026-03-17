import axios from "./axios";

export const obtenerPosts = () => axios.get("/posts");

export const crearPost = (data, token) =>
  axios.post("/posts", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const subirMediaPost = (file, token) => {
  const formData = new FormData();
  formData.append("media", file);
  return axios.post("/posts/upload-media", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const toggleLikePost = (postId, token) =>
  axios.post(`/posts/${postId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const comentarPost = (postId, texto, token) =>
  axios.post(
    `/posts/${postId}/comentar`,
    { texto },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const eliminarPost = (postId, token) =>
  axios.delete(`/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const eliminarComentarioPost = (postId, commentId, token) =>
  axios.delete(`/posts/${postId}/comentarios/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
