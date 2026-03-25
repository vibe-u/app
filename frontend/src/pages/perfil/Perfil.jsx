import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PostCard } from "../dashboard/UserDashboard";
import { resolveAvatarUrl } from "../../utils/mediaUrl";
import {
  cancelFriendRequest,
  getPublicUserProfile,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from "../../Services/users";
import "./Perfil.css";

const Perfil = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: "",
    title: "",
    message: "",
  });

  const loadProfile = async () => {
    if (!id) return;
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

  const openConfirm = (action, title, message) => {
    setConfirmModal({ open: true, action, title, message });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, action: "", title: "", message: "" });
  };

  const executeAction = async () => {
    try {
      setProcessing(true);
      if (confirmModal.action === "add") {
        await sendFriendRequest(id);
      }
      if (confirmModal.action === "cancel") {
        await cancelFriendRequest(id);
      }
      if (confirmModal.action === "remove") {
        await removeFriend(id);
      }
      await loadProfile();
      closeConfirm();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo completar la accion");
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

    if (status === "self") {
      return <p className="perfil-public-status">Este es tu perfil.</p>;
    }

    if (status === "friends") {
      return (
        <div className="perfil-public-actions">
          <p className="perfil-public-status">Ya son amigos.</p>
          <button
            className="perfil-public-btn perfil-public-btn-danger"
            type="button"
            onClick={() =>
              openConfirm(
                "remove",
                "Eliminar amigo",
                "¿Seguro que deseas eliminar a este usuario de tu lista de amigos?"
              )
            }
            disabled={processing}
          >
            ❌ Eliminar amigo
          </button>
        </div>
      );
    }

    if (status === "pending_sent") {
      return (
        <div className="perfil-public-actions">
          <p className="perfil-public-status">Solicitud enviada.</p>
          <button
            className="perfil-public-btn perfil-public-btn-secondary"
            type="button"
            onClick={() =>
              openConfirm(
                "cancel",
                "Cancelar solicitud",
                "¿Deseas cancelar la solicitud de amistad enviada?"
              )
            }
            disabled={processing}
          >
            🚫 Cancelar solicitud
          </button>
        </div>
      );
    }

    if (status === "pending_received") {
      return (
        <div className="perfil-public-actions">
          <button
            className="perfil-public-btn"
            type="button"
            onClick={() => handleRespond("accept")}
            disabled={processing}
          >
            ✅ Aceptar amistad
          </button>
          <button
            className="perfil-public-btn perfil-public-btn-secondary"
            type="button"
            onClick={() => handleRespond("reject")}
            disabled={processing}
          >
            ⛔ Rechazar
          </button>
        </div>
      );
    }

    return (
      <button
        className="perfil-public-btn"
        type="button"
        onClick={() =>
          openConfirm(
            "add",
            "Agregar amigo",
            "¿Deseas enviar una solicitud de amistad a este usuario?"
          )
        }
        disabled={processing}
      >
        ➕ Agregar amigo
      </button>
    );
  };

  if (loading) {
    return (
      <main className="perfil-main">
        <h1 className="main-title">Cargando perfil...</h1>
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="perfil-main">
        <h1 className="main-title">No se encontro el usuario</h1>
        {error ? <p className="perfil-public-error">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="perfil-main perfil-public-main">
      <section className="perfil-public-header">
        <img
          className="perfil-public-avatar"
          src={resolveAvatarUrl(data.user.avatar) || "https://via.placeholder.com/120"}
          alt={data.user.nombre}
        />
        <div>
          <h2>{data.user.nombre}</h2>
          <p>{data.user.descripcion || "Sin descripcion por ahora."}</p>
          <div className="perfil-public-stats">
            <span>{data.user.universidad || "Universidad"}</span>
            <span>{data.user.carrera || "Carrera"}</span>
            <span>{data.user.rol || "estudiante"}</span>
          </div>
          {renderFriendActions()}
          {error ? <p className="perfil-public-error">{error}</p> : null}
        </div>
      </section>

      <section className="perfil-public-section">
        <h3>Publicaciones</h3>
        <div className="card_grid__dash">
          {(data.posts || []).map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          {!data.posts?.length ? <p className="chat_hint__dash">Sin publicaciones todavia.</p> : null}
        </div>
      </section>

      <section className="perfil-public-section">
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

      {confirmModal.open ? (
        <div className="perfil-modal-overlay" role="dialog" aria-modal="true">
          <div className="perfil-modal-card">
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="perfil-modal-actions">
              <button
                type="button"
                className="perfil-public-btn perfil-public-btn-secondary"
                onClick={closeConfirm}
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  confirmModal.action === "remove"
                    ? "perfil-public-btn perfil-public-btn-danger"
                    : "perfil-public-btn"
                }
                onClick={executeAction}
                disabled={processing}
              >
                {processing ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Perfil;
