import { getApiUrl, parseApiError } from "@/lib/api/client";

export type CreateContactMessagePayload = {
  name: string;
  email: string;
  message: string;
};

export type CreateContactMessageResponse = {
  success: boolean;
  message: string;
};

export async function createContactMessage(
  payload: CreateContactMessagePayload,
): Promise<CreateContactMessageResponse> {
  const response = await fetch(getApiUrl("contact"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible d’envoyer le message.",
    );
  }

  return response.json();
}