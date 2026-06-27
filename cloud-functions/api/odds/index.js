import { handleOddsRequest } from "../../../api/odds.js";

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
  const { request } = context;
  const result = await handleOddsRequest({
    method: request.method,
    url: request.url,
    query: queryFromUrl(request.url),
  });

  return jsonResponse(result);
}
