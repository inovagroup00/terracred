import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "1" ? "/terracred/cliente/" : "/",
  server: { port: 5174, host: true },
  preview: { port: 4174, host: true },
});
