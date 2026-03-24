import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFriendNotifications, getModerationNotifications, respondFriendRequest } from "../../../Services/users";
import { getEventNotifications } from "../../../Services/events";

const NotificationsView = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setError("");
      const [friendsRes, eventsRes, moderationRes] = await Promise.all([
        getFriendNotifications(),
        getEventNotifications(),
        getModerationNotifications(),
      ]);
      const friendItems = Array.isArray(friendsRes?.data) ? friendsRes.data : [];
      const eventItems = Array.isArray(eventsRes?.data) ? eventsRes.data : [];
      const moderationItems = Array.isArray(moderationRes?.data) ? moderationRes.data : [];
      const merged = [...friendItems, ...eventItems, ...moderationItems].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setNotifications(merged);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudieron cargar notificaciones");
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

  return (
    <section className="panel__dash">
      <h3>Notificaciones</h3>
      {error ? <p className="chat_error__dash">{error}</p> : null}

      {!notifications.length ? (
        <ul className="list__dash">
          <li>No tienes notificaciones pendientes.</li>
        </ul>
      ) : (
        <div className="card_grid__dash">
          {notifications.map((item) => (
            <article key={item._id} className="post_card__dash">
              <p>{item.message}</p>
              {item.type === "friend_request" ? (
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationsView;
