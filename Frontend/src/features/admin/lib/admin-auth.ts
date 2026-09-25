// The admin session lives in a httpOnly cookie set by the backend on login —
// it's never readable from JS, so every admin fetch must pass
// `credentials: "include"` for the browser to send it cross-origin.
export function getAdminAuthHeaders(withJson = true) {
  const headers: Record<string, string> = {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
  };

  return headers;
}