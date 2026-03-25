import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const publicHost = process.env.VITE_PUBLIC_HOST || "localhost";
const usingRemoteHost = !["localhost", "127.0.0.1"].includes(publicHost);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost", "127.0.0.1", "vibeu-app.linkpc.net"],
    hmr: {
      host: publicHost,
      protocol: usingRemoteHost ? "wss" : "ws",
      clientPort: usingRemoteHost ? 443 : 5173,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost", "127.0.0.1", "vibeu-app.linkpc.net"],
  },
});
