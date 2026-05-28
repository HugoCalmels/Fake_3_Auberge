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
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response = await fetch(getApiUrl("auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Erreur de connexion.");
  }

  return response.json();
}

export async function getMe(token: string) {
  const response = await fetch(getApiUrl("auth/me"), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Non authentifie.");
  }

  return response.json();
}
