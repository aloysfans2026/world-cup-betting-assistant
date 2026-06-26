import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

interface VercelRequest {
  method?: string;
  query?: Record<string, string>;
  url?: string;
}

interface VercelResponse {
  json: (body: unknown) => VercelResponse;
  setHeader: (key: string, value: string) => VercelResponse;
  status: (code: number) => VercelResponse;
}

type VercelHandler = (request: VercelRequest, response: VercelResponse) => Promise<void> | void;

function queryFor(request: IncomingMessage): Record<string, string> {
  const url = new URL(request.url || "/", "http://localhost");
  return Object.fromEntries(url.searchParams.entries());
}

function responseAdapter(response: ServerResponse): VercelResponse {
  const adapter: VercelResponse = {
    json(body) {
      if (!response.hasHeader("Content-Type")) {
        response.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      response.end(JSON.stringify(body));
      return adapter;
    },
    setHeader(key, value) {
      response.setHeader(key, value);
      return adapter;
    },
    status(code) {
      response.statusCode = code;
      return adapter;
    },
  };

  return adapter;
}

function oddsApiDevPlugin(): Plugin {
  return {
    name: "odds-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/odds", async (request, response) => {
        try {
          const modulePath = new URL("./api/odds.js", import.meta.url).href;
          const { default: handler } = (await import(modulePath)) as { default: VercelHandler };

          await handler(
            {
              method: request.method,
              query: queryFor(request),
              url: request.url,
            },
            responseAdapter(response),
          );
        } catch {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ success: false, message: "今日赔率获取失败，请稍后重试。" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const footballApiKey = env.FOOTBALL_API_KEY || "";

  return {
    plugins: [react(), oddsApiDevPlugin()],
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
