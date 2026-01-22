import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["387fa14f48f0.ngrok-free.app"],
  },
  preview: {
    host: true,
    port: 5173,
  },
});
