import {
  AdminRoomTypeDto,
  CreateAdminRoomTypePayload,
} from "@/features/admin/types";
import { getAdminAuthHeaders } from "@/features/admin/lib/admin-auth";
import { getApiUrl, parseApiError } from "@/lib/api/client";

export async function getAdminRoomTypes(): Promise<AdminRoomTypeDto[]> {
  const response = await fetch(getApiUrl("admin/room-types"), {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les types de chambres."
    );
  }

  return response.json();
}

export async function createAdminRoomType(
  payload: CreateAdminRoomTypePayload
): Promise<AdminRoomTypeDto> {
  const response = await fetch(getApiUrl("admin/room-types"), {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de créer le type de chambre."
    );
  }

  return response.json();
}
