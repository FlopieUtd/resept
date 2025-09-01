import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/resept/' : '/',
  server: {
    proxy: {
      "/extract": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
