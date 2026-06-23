import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const footballApiKey = env.FOOTBALL_API_KEY || "";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/matches": {
          target: "https://api.football-data.org",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/matches/, "/v4/competitions/WC/matches"),
          headers: footballApiKey
            ? {
                "X-Auth-Token": footballApiKey,
              }
            : {},
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
