import axios from "./axios";

export const obtenerPosts = () => axios.get("/posts");

export const crearPost = (data, token) =>
  axios.post("/posts", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const subirMediaPost = (file, token, onProgress) => {
  const formData = new FormData();
  formData.append("media", file);
  return axios.post("/posts/upload-media", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (!event?.total || typeof onProgress !== "function") return;
      const progress = Math.min(100, Math.round((event.loaded * 100) / event.total));
      onProgress(progress);
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
