import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AssignAdminBookingRoomPayload,
  CreateAdminBookingPayload,
  UpdateAdminBookingPayload,
} from "./admin.types";
import {
  getAdminAuthHeaders,
  getApiBaseUrl,
  parseApiError,
} from "./api.utils";

const API_BASE_URL = getApiBaseUrl();

export async function getAdminBookings(): Promise<AdminBookingDto[]> {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les réservations."
    );
  }

  return response.json();
}

export async function getAdminBookingById(
  bookingId: string
): Promise<AdminBookingDetailDto> {
  const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer la réservation."
    );
  }

  return response.json();
}

export async function createAdminBooking(
  payload: CreateAdminBookingPayload
): Promise<AdminBookingDetailDto> {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de créer la réservation."
    );
  }

  return response.json();
}

export async function updateAdminBooking(
  bookingId: string,
  payload: UpdateAdminBookingPayload
): Promise<AdminBookingDetailDto> {
  const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de modifier la réservation."
    );
  }

  return response.json();
}

export async function cancelAdminBooking(
  bookingId: string
): Promise<AdminBookingDto> {
  const response = await fetch(
    `${API_BASE_URL}/admin/bookings/${bookingId}/cancel`,
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible d'annuler la réservation."
    );
  }

  return response.json();
}

export async function assignAdminBookingRoom(
  bookingId: string,
  payload: AssignAdminBookingRoomPayload
): Promise<AdminBookingDetailDto> {
  const response = await fetch(
    `${API_BASE_URL}/admin/bookings/${bookingId}/assign-room`,
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de réassigner la chambre."
    );
  }

  return response.json();
}