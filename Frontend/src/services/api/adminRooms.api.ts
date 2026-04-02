import type {
  AdminRoomDto,
  AdminRoomStatus,
} from "./admin.types";
import {
  getAdminAuthHeaders,
  getApiBaseUrl,
  parseApiError,
} from "./api.utils";

const API_BASE_URL = getApiBaseUrl();

export type CreateAdminRoomPayload = {
  number: string;
  floor: number;
  roomTypeId: string;
  status: AdminRoomStatus;
};

export type UpdateAdminRoomStatusPayload = {
  status: AdminRoomStatus;
};

export async function getAdminRooms(): Promise<AdminRoomDto[]> {
  const response = await fetch(`${API_BASE_URL}/admin/rooms`, {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible de récupérer les chambres.");
  }

  return response.json();
}

export async function createAdminRoom(
  payload: CreateAdminRoomPayload
): Promise<AdminRoomDto> {
  const response = await fetch(`${API_BASE_URL}/admin/rooms`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible d'ajouter la chambre.");
  }

  return response.json();
}

export async function updateAdminRoomStatus(
  roomId: string,
  payload: UpdateAdminRoomStatusPayload
): Promise<AdminRoomDto> {
  const response = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}/status`, {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de mettre à jour le statut de la chambre."
    );
  }

  return response.json();
}

export async function deleteAdminRoom(roomId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible de supprimer la chambre.");
  }
}