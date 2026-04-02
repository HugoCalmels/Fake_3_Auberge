import { getApiUrl, parseApiError } from "@/lib/api/client";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  admin: {
    id: string;
    email: string;
    role: string;
  };
};

export async function loginAdmin(
  payload: LoginPayload
): Promise<LoginResponse> {
  const response = await fetch(getApiUrl("auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Erreur de connexion.");
  }

  return response.json();
}

export async function getMe(token: string) {
  const response = await fetch(getApiUrl("auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Non authentifié.");
  }

  return response.json();
}

export function getStoredAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setStoredAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function removeStoredAdminToken() {
  localStorage.removeItem("admin_token");
}
