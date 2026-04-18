import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "1" ? "/terracred/admin/" : "/",
  server: { port: 5176, host: true },
  preview: { port: 4176, host: true },
});
