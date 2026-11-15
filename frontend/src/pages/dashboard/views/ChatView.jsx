import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getChatConversations,
  getChatUsers,
  getMessagesWithUser,
  sendMessageToUser,
} from "../../../Services/chat";
import storeNotifications from "../../../context/storeNotifications";
import "../../../components/notifications/NotificationAlerts.css";
import ChatConversationList from "./chat/ChatConversationList";
import ChatConversationPanel from "./chat/ChatConversationPanel";

const areMessagesEqual = (prev = [], next = []) => {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (!a || !b) return false;
    if (
      a._id !== b._id ||
      a.sender !== b.sender ||
      a.receiver !== b.receiver ||
      a.content !== b.content ||
      a.createdAt !== b.createdAt
    ) {
      return false;
    }
  }
  return true;
};

const ChatView = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 770px)").matches : false
  );
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadUsers = async (searchValue = "") => {
    const { data } = await getChatUsers(searchValue);
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadConversations = async () => {
    const { data } = await getChatConversations();
    setConversations(Array.isArray(data) ? data : []);
  };

  const loadMessagesForUser = async (userId, { syncUnread = false } = {}) => {
    if (!userId) return;
    const { data } = await getMessagesWithUser(userId);
    const nextMessages = Array.isArray(data?.messages) ? data.messages : [];
    setMessages((prevMessages) =>
      areMessagesEqual(prevMessages, nextMessages) ? prevMessages : nextMessages
    );
    if (syncUnread) {
      storeNotifications.getState().refreshChat();
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setRetrying(true);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        setError("");
        await Promise.all([loadUsers(), loadConversations()]);
        setLoading(false);
        setRetrying(false);
        return;
      } catch (e) {
        if (attempt === 3) {
          setError(e?.response?.data?.msg || "No se pudo cargar el chat");
          setLoading(false);
          setRetrying(false);
          return;
        }
        await wait(attempt * 450);
      }
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 770px)");
    const updateLayout = () => setIsMobile(media.matches);
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const userIdFromState = location.state?.openUserId;
    if (!userIdFromState) return;
    setActiveUserId(userIdFromState);
  }, [location.state]);

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
        unreadCount: conversation.unreadCount || 0,
        hasConversation: true,
      }));

    const usersWithoutConversation = users
      .filter((user) => !convoByUserId.has(user._id))
      .map((user) => ({
        user,
        lastMessage: "Inicia una conversacion",
        lastMessageAt: "",
        unreadCount: 0,
        hasConversation: false,
      }));

    return [...fromConversations, ...usersWithoutConversation].sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }, [conversations, users]);

  const activeUser = recents.find((item) => item.user._id === activeUserId)?.user || null;

  useEffect(() => {
    if (activeUserId || isMobile) return;
    if (!recents.length) return;
    setActiveUserId(recents[0].user._id);
  }, [activeUserId, recents, isMobile]);

  useEffect(() => {
    loadMessagesForUser(activeUserId, { syncUnread: true }).catch(() => {
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
    if (!shouldAutoScrollRef.current) return;
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [activeUserId]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom < 72;
  };

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
    <section className={`chat_layout__dash ${activeUserId ? "has-active-chat__dash" : ""}`}>
      <ChatConversationList
        recents={recents}
        activeUserId={activeUserId}
        onSelectUser={setActiveUserId}
        search={search}
        onSearch={handleSearch}
        loading={loading}
        error={error}
        retrying={retrying}
        onRetry={loadInitialData}
      />
      <ChatConversationPanel
        activeUser={activeUser}
        activeUserId={activeUserId}
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSendMessage}
        sending={sending}
        error={error}
        messagesContainerRef={messagesContainerRef}
        onMessagesScroll={handleMessagesScroll}
        onBack={() => setActiveUserId("")}
      />
    </section>
  );
};

export default ChatView;
