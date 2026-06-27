import { handleMatchesRequest } from "../../../api/matches.js";

function queryFromUrl(url) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}

function jsonResponse(result) {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(result.headers || {}),
    },
  });
}

export async function onRequest(context) {
  const { env, request } = context;
  const result = await handleMatchesRequest({
    method: request.method,
    url: request.url,
    query: queryFromUrl(request.url),
    env,
  });

  return jsonResponse(result);
}
