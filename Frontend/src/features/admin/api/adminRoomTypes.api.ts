import type {
  AdminRoomTypeDto,
  CreateAdminRoomTypePayload,
  UpdateAdminRoomTypePayload,
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
      "Impossible de récupérer les types de chambres.",
    );
  }

  return response.json();
}

export async function createAdminRoomType(
  payload: CreateAdminRoomTypePayload,
): Promise<AdminRoomTypeDto> {
  const response = await fetch(getApiUrl("admin/room-types"), {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de créer le type de chambre.",
    );
  }

  return response.json();
}

export async function updateAdminRoomType(
  roomTypeId: string,
  payload: UpdateAdminRoomTypePayload,
): Promise<AdminRoomTypeDto> {
  const response = await fetch(getApiUrl(`admin/room-types/${roomTypeId}`), {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de modifier le type de chambre.",
    );
  }

  return response.json();
}

export async function deleteAdminRoomType(roomTypeId: string): Promise<void> {
  const response = await fetch(getApiUrl(`admin/room-types/${roomTypeId}`), {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de supprimer le type de chambre.",
    );
  }
}

export async function uploadAdminRoomTypeImage(file: File): Promise<{
  imageUrl: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(getApiUrl("admin/room-types/upload-image"), {
    method: "POST",
    headers: getAdminAuthHeaders(false),
    body: formData,
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible d'envoyer l'image.");
  }

  return response.json();
}

export function getAdminRoomTypeImageSrc(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return getApiUrl(value.replace(/^\//, ""));
}