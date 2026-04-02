const API_BASE_URL = "http://localhost:3001";

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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Erreur de connexion.");
  }

  return response.json();
}

export async function getMe(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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