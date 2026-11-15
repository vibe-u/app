import { FaPaperPlane } from "react-icons/fa";

export default function ChatConversationPanel({
  activeUser,
  activeUserId,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending,
  error,
  messagesContainerRef,
  onMessagesScroll,
  onBack,
}) {
  return (
    <div className="panel__dash chat_conversation_panel__dash">
      <div className="chat-conversation-header__dash">
        <button type="button" className="chat-back-button__dash" onClick={onBack} aria-label="Volver a conversaciones">
          ←
        </button>
        <h3>{activeUser?.nombre || "Selecciona una conversación"}</h3>
      </div>
      <div className="chat_messages__dash" ref={messagesContainerRef} onScroll={onMessagesScroll}>
        {messages.map((msg) => (
          <p key={msg._id} className={msg.sender === activeUserId ? "" : "mine__dash"}>
            {msg.content}
          </p>
        ))}
        {!messages.length && activeUser ? (
          <p className="chat_empty__dash">Aún no hay mensajes. Escribe el primero.</p>
        ) : null}
        {!activeUser ? <p className="chat_empty__dash">Elige un chat para comenzar.</p> : null}
      </div>
      <div className="chat_input__dash">
        <input
          className="input__dash"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSend();
          }}
          placeholder="Escribe un mensaje..."
          disabled={!activeUser}
          aria-label="Mensaje"
        />
        <button
          className="button__dash chat-send-button__dash"
          type="button"
          onClick={onSend}
          disabled={!draft.trim() || !activeUser || sending}
          aria-label={sending ? "Enviando mensaje" : "Enviar mensaje"}
          title={sending ? "Enviando..." : "Enviar mensaje"}
        >
          {sending ? "…" : <FaPaperPlane aria-hidden="true" />}
        </button>
      </div>
      {error ? <p className="chat_error__dash">{error}</p> : null}
    </div>
  );
}
