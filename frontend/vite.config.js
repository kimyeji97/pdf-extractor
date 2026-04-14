import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 개발 중 CORS 우회: /api/* → FastAPI
      "/api": "http://localhost:8000",
    },
  },
});
