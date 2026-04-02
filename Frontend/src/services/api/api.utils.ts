const API_BASE_URL = "http://localhost:3001";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function parseApiError(
  response: Response,
  fallbackMessage: string
): Promise<Error> {
  const data = await response.json().catch(() => null);

  const message =
    typeof data?.message === "string"
      ? data.message
      : Array.isArray(data?.message)
        ? data.message.join(", ")
        : fallbackMessage;

  return new Error(message);
}