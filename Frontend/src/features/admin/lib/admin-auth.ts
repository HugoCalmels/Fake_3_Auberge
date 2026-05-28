const ADMIN_TOKEN_KEY = "admin_token";

export function getStoredAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeStoredAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminAuthHeaders(withJson = true) {
  const token = getStoredAdminToken();

  const headers: Record<string, string> = {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}