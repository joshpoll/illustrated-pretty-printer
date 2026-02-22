import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  base: process.env.BASE_PATH,
  build: {
    target: "esnext",
  },
  server: {
    port: 5555,
  },
});
