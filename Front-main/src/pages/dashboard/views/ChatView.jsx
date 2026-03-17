import { useEffect, useMemo, useRef, useState } from "react";
import {
  getChatConversations,
  getChatUsers,
  getMessagesWithUser,
  sendMessageToUser,
} from "../../../Services/chat";

const formatTime = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatView = () => {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const loadUsers = async (searchValue = "") => {
    const { data } = await getChatUsers(searchValue);
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadConversations = async () => {
    const { data } = await getChatConversations();
    setConversations(Array.isArray(data) ? data : []);
  };

  const loadMessagesForUser = async (userId) => {
    if (!userId) return;
    const { data } = await getMessagesWithUser(userId);
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadUsers(), loadConversations()]);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo cargar el chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const recents = useMemo(() => {
    const convoByUserId = new Map(
      conversations.map((conversation) => [conversation.otherUser?._id, conversation])
    );

    const fromConversations = conversations
      .filter((conversation) => conversation.otherUser?._id)
      .map((conversation) => ({
        user: conversation.otherUser,
        lastMessage: conversation.lastMessage || "Inicia una conversacion",
        lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || "",
        hasConversation: true,
      }));

    const usersWithoutConversation = users
      .filter((user) => !convoByUserId.has(user._id))
      .map((user) => ({
        user,
        lastMessage: "Inicia una conversacion",
        lastMessageAt: "",
        hasConversation: false,
      }));

    return [...fromConversations, ...usersWithoutConversation].sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }, [conversations, users]);

  const activeUser = recents.find((item) => item.user._id === activeUserId)?.user || null;

  useEffect(() => {
    if (activeUserId) return;
    if (!recents.length) return;
    setActiveUserId(recents[0].user._id);
  }, [activeUserId, recents]);

  useEffect(() => {
    loadMessagesForUser(activeUserId).catch(() => {
      setMessages([]);
    });
  }, [activeUserId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations().catch(() => null);
      if (activeUserId) {
        loadMessagesForUser(activeUserId).catch(() => null);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSearch = async (value) => {
    setSearch(value);
    try {
      await loadUsers(value);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo buscar usuarios");
    }
  };

  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeUserId || sending) return;

    try {
      setSending(true);
      setError("");
      await sendMessageToUser(activeUserId, text);
      setDraft("");
      await Promise.all([loadConversations(), loadMessagesForUser(activeUserId)]);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat_layout__dash">
      <div className="panel__dash">
        <h3>Chats recientes</h3>
        <input className="input__dash"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
        />

        {loading ? <p className="chat_hint__dash">Cargando usuarios...</p> : null}
        {!loading && !recents.length ? (
          <p className="chat_hint__dash">No hay usuarios disponibles para chatear.</p>
        ) : null}

        {recents.map((item) => (
          <button
            type="button"
            key={item.user._id}
            className={`chat_item__dash ${item.user._id === activeUserId ? "chat_item_active__dash" : ""}`}
            onClick={() => setActiveUserId(item.user._id)}
          >
            <div className="chat_item_row__dash">
              <strong>{item.user.nombre}</strong>
              <span>{item.lastMessageAt ? formatTime(item.lastMessageAt) : ""}</span>
            </div>
            <p>{item.lastMessage}</p>
          </button>
        ))}
      </div>

      <div className="panel__dash chat_conversation_panel__dash">
        <h3>Conversacion con {activeUser?.nombre || "..."}</h3>
        <div className="chat_messages__dash">
          {messages.map((msg) => (
            <p key={msg._id} className={msg.sender === activeUserId ? "" : "mine__dash"}>
              {msg.content}
            </p>
          ))}
          {!messages.length && activeUser ? (
            <p className="chat_empty__dash">Aun no hay mensajes. Escribe el primero.</p>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat_input__dash">
          <input
            className="input__dash"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Escribe un mensaje..."
            disabled={!activeUser}
          />
          <button
            className="button__dash"
            type="button"
            onClick={handleSendMessage}
            disabled={!draft.trim() || !activeUser || sending}
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
        {error ? <p className="chat_error__dash">{error}</p> : null}
      </div>
    </section>
  );
};

export default ChatView;
