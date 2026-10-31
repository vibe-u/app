import NotifBadge from "../../../../components/notifications/NotifBadge";

const formatTime = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatConversationList({
  recents,
  activeUserId,
  onSelectUser,
  search,
  onSearch,
  loading,
  error,
  retrying,
  onRetry,
}) {
  return (
    <div className="panel__dash chat_list_panel__dash">
      <h3>Chats</h3>
      <input
        className="input__dash"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Buscar por nombre o correo..."
        aria-label="Buscar conversaciones"
      />
      {loading ? <p className="chat_hint__dash">Cargando usuarios...</p> : null}
      {!loading && error ? (
        <div className="friend_actions__dash chat-retry__dash">
          <button className="button__dash" type="button" onClick={onRetry} disabled={retrying}>
            {retrying ? "Reintentando..." : "Reintentar"}
          </button>
        </div>
      ) : null}
      {!loading && !recents.length ? (
        <p className="chat_hint__dash">No hay usuarios disponibles para chatear.</p>
      ) : null}
      <div className="chat-list-scroll__dash">
        {recents.map((item) => (
          <button
            type="button"
            key={item.user._id}
            className={`chat_item__dash ${item.user._id === activeUserId ? "chat_item_active__dash" : ""}`}
            onClick={() => onSelectUser(item.user._id)}
          >
            <div className="chat_item_row__dash">
              <strong>{item.user.nombre}</strong>
              <span className="chat_item_meta__dash">
                {item.unreadCount > 0 ? <NotifBadge count={item.unreadCount} /> : null}
                {formatTime(item.lastMessageAt)}
              </span>
            </div>
            <p>{item.lastMessage}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
