import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFriendNotifications,
  getMatchNotifications,
  getModerationNotifications,
  respondFriendRequest,
} from "../../../Services/users";
import { getEventNotifications } from "../../../Services/events";

const HISTORY_KEY = "vibeu.notifications.history.v1";

const readHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (items) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 300)));
  } catch {
    // ignore localStorage errors
  }
};

const NotificationsView = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [historyNotifications, setHistoryNotifications] = useState(readHistory());
  const [error, setError] = useState("");
  const [tab, setTab] = useState("recent");
  const [loading, setLoading] = useState(true);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadNotifications = async () => {
    setLoading(true);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        setError("");
        const [friendsRes, eventsRes, moderationRes, matchRes] = await Promise.all([
          getFriendNotifications(),
          getEventNotifications(),
          getModerationNotifications(),
          getMatchNotifications(),
        ]);
        const friendItems = Array.isArray(friendsRes?.data) ? friendsRes.data : [];
        const eventItems = Array.isArray(eventsRes?.data) ? eventsRes.data : [];
        const moderationItems = Array.isArray(moderationRes?.data) ? moderationRes.data : [];
        const matchItems = Array.isArray(matchRes?.data) ? matchRes.data : [];
        const merged = [...friendItems, ...eventItems, ...moderationItems, ...matchItems].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setNotifications(merged);

        const previous = readHistory();
        const map = new Map(previous.map((item) => [item._id, item]));
        const now = new Date().toISOString();
        merged.forEach((item) => {
          const prev = map.get(item._id);
          map.set(item._id, {
            ...prev,
            ...item,
            firstSeenAt: prev?.firstSeenAt || item.createdAt || now,
            lastSeenAt: now,
          });
        });
        const history = [...map.values()].sort(
          (a, b) => new Date(b.lastSeenAt || b.createdAt || 0) - new Date(a.lastSeenAt || a.createdAt || 0)
        );
        writeHistory(history);
        setHistoryNotifications(history);
        setLoading(false);
        return;
      } catch (e) {
        if (attempt === 3) {
          setError(e?.response?.data?.msg || "No se pudieron cargar notificaciones");
          setLoading(false);
          return;
        }
        await wait(attempt * 450);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleAction = async (fromUserId, action) => {
    try {
      await respondFriendRequest(fromUserId, action);
      await loadNotifications();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo responder solicitud");
    }
  };

  const notificationsToRender = tab === "history" ? historyNotifications : notifications;

  return (
    <section className="panel__dash">
      <h3>Notificaciones</h3>
      <div className="friend_actions__dash" style={{ marginTop: "8px" }}>
        <button
          className="button__dash"
          type="button"
          onClick={() => setTab("recent")}
          style={{ opacity: tab === "recent" ? 1 : 0.75 }}
        >
          Recientes
        </button>
        <button
          className="button__dash"
          type="button"
          onClick={() => setTab("history")}
          style={{ opacity: tab === "history" ? 1 : 0.75 }}
        >
          Historial
        </button>
      </div>
      {error ? <p className="chat_error__dash">{error}</p> : null}
      {error ? (
        <div className="friend_actions__dash" style={{ marginBottom: "8px" }}>
          <button className="button__dash" type="button" onClick={loadNotifications}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? <p className="chat_hint__dash">Cargando notificaciones...</p> : null}

      {!loading && !notificationsToRender.length ? (
        <ul className="list__dash">
          <li>{tab === "history" ? "No hay historial de notificaciones." : "No tienes notificaciones pendientes."}</li>
        </ul>
      ) : (
        <div className="card_grid__dash">
          {notificationsToRender.map((item) => (
            <article key={item._id} className="post_card__dash">
              <p>{item.message}</p>
              {tab === "history" ? (
                <p style={{ margin: "6px 0 0", fontSize: "0.82rem", opacity: 0.85 }}>
                  Visto: {new Date(item.lastSeenAt || item.createdAt || Date.now()).toLocaleString()}
                </p>
              ) : null}

              {item.type === "friend_request" && tab !== "history" ? (
                <div className="friend_actions__dash">
                  <button className="button__dash" type="button" onClick={() => navigate(`/dashboard/usuario/${item.fromUser._id}`)}>
                    Ver perfil
                  </button>
                  <button className="button__dash" type="button" onClick={() => handleAction(item.fromUser._id, "accept")}>
                    Aceptar
                  </button>
                  <button className="button__dash" type="button" onClick={() => handleAction(item.fromUser._id, "reject")}>
                    Rechazar
                  </button>
                </div>
              ) : null}

              {item.type === "event_reminder" ? (
                <div className="friend_actions__dash">
                  <button className="button__dash" type="button" onClick={() => navigate("/dashboard/eventos")}>
                    Ver evento
                  </button>
                </div>
              ) : null}

              {item.type === "moderation_alert" ? (
                <div className="friend_actions__dash">
                  <button className="button__dash" type="button" onClick={() => navigate("/dashboard/feed")}>
                    Ir al feed
                  </button>
                </div>
              ) : null}

              {item.type === "match_like" ? (
                <div className="friend_actions__dash">
                  {item.fromUser?._id ? (
                    <button
                      className="button__dash"
                      type="button"
                      onClick={() => navigate(`/dashboard/usuario/${item.fromUser._id}`)}
                    >
                      Ver perfil
                    </button>
                  ) : null}
                  <button className="button__dash" type="button" onClick={() => navigate("/matches")}>
                    Ir a matches
                  </button>
                </div>
              ) : null}

              {item.type === "match_success" ? (
                <div className="friend_actions__dash">
                  {item.withUser?._id ? (
                    <button
                      className="button__dash"
                      type="button"
                      onClick={() =>
                        navigate("/dashboard/chat", {
                          state: {
                            openUserId: item.withUser._id,
                            fromMatch: true,
                          },
                        })
                      }
                    >
                      Abrir chat
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationsView;
