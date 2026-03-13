import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearPost } from "../../../Services/posts";

const CreatePostView = () => {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublicar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setLoading(true);
      await crearPost({ texto, imagen }, token);
      setTexto("");
      setImagen("");
      navigate("/dashboard/feed");
    } catch (error) {
      console.error(error);
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
          rows="4"
          placeholder="Que quieres compartir hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <label>URL de imagen (opcional)</label>
        <input
          type="text"
          placeholder="https://..."
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
        />
        <button type="submit">{loading ? "Publicando..." : "Publicar"}</button>
      </form>
    </section>
  );
};

export default CreatePostView;

