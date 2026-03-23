import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChatUsers } from "../../Services/chat";
import { resolveAvatarUrl } from "../../utils/mediaUrl";
import "./Matches.css";

const DEFAULT_AVATAR = "/default-avatar.svg";

const Matches = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getChatUsers("");
        setSuggestedUsers(Array.isArray(data) ? data : []);
      } catch (requestError) {
        console.error("Error al cargar matches:", requestError);
        setError("No se pudieron cargar los usuarios registrados.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, []);

  return (
    <section className="matches-section">
      <button className="back-btn" onClick={() => navigate(-1)}>
        Volver
      </button>
      <h2 className="matches-title">Tus posibles matches</h2>
      <p className="matches-subtitle">
        Conecta con personas registradas dentro de la plataforma
      </p>

      {loading ? <p className="matches-state">Cargando usuarios...</p> : null}
      {error ? <p className="matches-state matches-error">{error}</p> : null}
      {!loading && !error && suggestedUsers.length === 0 ? (
        <p className="matches-state">No hay usuarios disponibles por ahora.</p>
      ) : null}

      <div className="matches-grid">
        {suggestedUsers.map((user) => (
          <div key={user._id} className="match-card">
            <img
              src={resolveAvatarUrl(user.avatar) || DEFAULT_AVATAR}
              alt={user.nombre || "Usuario"}
              className="match-avatar"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
            <h4>{user.nombre || "Usuario"}</h4>
            <p>{user.universidad || user.carrera || "Estudiante registrado"}</p>
            <button
              className="connect-btn"
              type="button"
              onClick={() => navigate(`/dashboard/usuario/${user._id}`)}
            >
              Ver perfil
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Matches;
