import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPublicUserProfile,
  respondFriendRequest,
  sendFriendRequest,
} from "../../../Services/users";
import { PostCard } from "../UserDashboard";
import { resolveAvatarUrl } from "../../../utils/mediaUrl";

const UserPublicProfileView = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPublicUserProfile(id);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleSendRequest = async () => {
    try {
      setProcessing(true);
      await sendFriendRequest(id);
      await loadProfile();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo enviar la solicitud");
    } finally {
      setProcessing(false);
    }
  };

  const handleRespond = async (action) => {
    try {
      setProcessing(true);
      await respondFriendRequest(id, action);
      await loadProfile();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo responder la solicitud");
    } finally {
      setProcessing(false);
    }
  };

  const renderFriendActions = () => {
    const status = data?.friendStatus;
    if (!status) return null;

    if (status === "self") return <p className="friend_status__dash">Este es tu perfil.</p>;
    if (status === "friends") return <p className="friend_status__dash">Ya son amigos.</p>;
    if (status === "pending_sent") return <p className="friend_status__dash">Solicitud enviada.</p>;
    if (status === "pending_received") {
      return (
        <div className="friend_actions__dash">
          <button className="button__dash" type="button" onClick={() => handleRespond("accept")} disabled={processing}>
            Aceptar amistad
          </button>
          <button className="button__dash" type="button" onClick={() => handleRespond("reject")} disabled={processing}>
            Rechazar
          </button>
        </div>
      );
    }

    return (
      <button className="button__dash" type="button" onClick={handleSendRequest} disabled={processing}>
        Solicitar amistad
      </button>
    );
  };

  if (loading) {
    return (
      <section className="panel__dash">
        <h3>Cargando perfil...</h3>
      </section>
    );
  }

  if (!data?.user) {
    return (
      <section className="panel__dash">
        <h3>No se encontro el usuario</h3>
      </section>
    );
  }

  return (
    <section className="view__dash">
      <section className="panel__dash profile_public__dash">
        <img
          src={resolveAvatarUrl(data.user.avatar) || "https://via.placeholder.com/120"}
          alt={data.user.nombre}
        />
        <div>
          <h3>{data.user.nombre}</h3>
          <p>{data.user.descripcion || "Sin descripcion por ahora."}</p>
          <div className="stats__dash">
            <span>{data.user.universidad || "Universidad"}</span>
            <span>{data.user.carrera || "Carrera"}</span>
            <span>{data.user.rol || "estudiante"}</span>
          </div>
          {renderFriendActions()}
          {error ? <p className="chat_error__dash">{error}</p> : null}
        </div>
      </section>

      <section className="panel__dash">
        <h3>Publicaciones</h3>
        <div className="card_grid__dash">
          {(data.posts || []).map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          {!data.posts?.length ? <p className="chat_hint__dash">Sin publicaciones todavia.</p> : null}
        </div>
      </section>

      <section className="panel__dash">
        <h3>Grupos</h3>
        <ul className="list__dash">
          {(data.groups || []).map((group) => (
            <li key={group._id}>
              <strong>{group.nombre}</strong>
              <span> - Miembros: {group.miembrosArray?.length || 0}</span>
            </li>
          ))}
          {!data.groups?.length ? <li>No pertenece a grupos visibles.</li> : null}
        </ul>
      </section>
    </section>
  );
};

export default UserPublicProfileView;
