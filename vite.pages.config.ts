import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "web",
    lib: {
      entry: "web-source/main.tsx",
      formats: ["es"],
      fileName: () => "pontinho.js",
      cssFileName: "pontinho",
    },
    minify: true,
  },
});
