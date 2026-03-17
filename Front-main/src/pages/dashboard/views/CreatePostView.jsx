import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearPost, subirMediaPost } from "../../../Services/posts";

const CreatePostView = () => {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState("");
  const [video, setVideo] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");

  const handleUploadMedia = async (file, expectedType) => {
    const token = localStorage.getItem("token");
    if (!token || !file) return;

    if (expectedType === "image") setUploadingImage(true);
    if (expectedType === "video") setUploadingVideo(true);
    setError("");

    try {
      const res = await subirMediaPost(file, token);
      if (res.data?.mediaType === "image") setImagen(res.data.url || "");
      if (res.data?.mediaType === "video") setVideo(res.data.url || "");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo subir el archivo");
    } finally {
      if (expectedType === "image") setUploadingImage(false);
      if (expectedType === "video") setUploadingVideo(false);
    }
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setLoading(true);
      setError("");
      await crearPost({ texto, imagen, video }, token);
      setTexto("");
      setImagen("");
      setVideo("");
      navigate("/dashboard/feed");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel__dash">
      <h3>Crear publicacion</h3>
      <form onSubmit={handlePublicar}>
        <label>Texto</label>
        <textarea
          className="textarea__dash"
          rows="4"
          placeholder="Que quieres compartir hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <label>Imagen (URL opcional)</label>
        <input
          className="input__dash"
          type="text"
          placeholder="https://..."
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
        />
        <input
          className="input__dash"
          type="file"
          accept="image/*"
          onChange={(e) => handleUploadMedia(e.target.files?.[0], "image")}
        />
        {uploadingImage ? <p className="chat_hint__dash">Subiendo imagen...</p> : null}

        <label>Video (URL opcional)</label>
        <input
          className="input__dash"
          type="text"
          placeholder="https://... (mp4/webm)"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
        />
        <input
          className="input__dash"
          type="file"
          accept="video/*"
          onChange={(e) => handleUploadMedia(e.target.files?.[0], "video")}
        />
        {uploadingVideo ? <p className="chat_hint__dash">Subiendo video...</p> : null}

        {error ? <p className="chat_error__dash">{error}</p> : null}
        <button className="button__dash" type="submit" disabled={loading || uploadingImage || uploadingVideo}>
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </section>
  );
};

export default CreatePostView;
