import { create } from "zustand";
import axios from "axios";
import storeAuth from "./storeAuth";
import { isTokenExpired } from "../utils/authToken";

const storeProfile = create((set) => ({
  user: null,

  clearUser: () => set({ user: null }),

  profile: async () => {
    const { token, clearToken } = storeAuth.getState();
    if (!token || isTokenExpired(token)) {
      clearToken();
      localStorage.removeItem("token");
      return;
    }

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`;
      const respuesta = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({ user: respuesta.data });
    } catch (error) {
      if (error?.response?.status === 401) {
        clearToken();
        localStorage.removeItem("token");
      }
      console.error("Error al obtener perfil:", error.response?.data || error);
    }
  },
}));

export default storeProfile;
