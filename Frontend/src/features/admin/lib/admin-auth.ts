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

export function getAdminAuthHeaders() {
  const token = getStoredAdminToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
