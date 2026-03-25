import axios from "axios";

const client = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
});

export default client;
