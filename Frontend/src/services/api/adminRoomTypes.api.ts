import {
  AdminRoomTypeDto,
  CreateAdminRoomTypePayload,
} from "./admin.types";
import { getAdminAuthHeaders, getApiBaseUrl, parseApiError } from "./api.utils";


const API_BASE_URL = getApiBaseUrl();

export async function getAdminRoomTypes(): Promise<AdminRoomTypeDto[]> {
  const response = await fetch(`${API_BASE_URL}/admin/room-types`, {
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
  const response = await fetch(`${API_BASE_URL}/admin/room-types`, {
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