import axios from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getChatUsers = (search = "") =>
  axios.get(`/chat/users?search=${encodeURIComponent(search)}`, getAuthConfig());

export const getChatConversations = () =>
  axios.get("/chat/conversations", getAuthConfig());

export const getMessagesWithUser = (userId) =>
  axios.get(`/chat/messages/${userId}`, getAuthConfig());

export const sendMessageToUser = (toUserId, content) =>
  axios.post("/chat/messages", { toUserId, content }, getAuthConfig());
