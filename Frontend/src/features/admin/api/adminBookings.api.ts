import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AssignAdminBookingRoomPayload,
  CreateAdminBookingPayload,
  CreateAdminBookingResponse,
  UpdateAdminBookingPayload,
} from "@/features/admin/types";
import { getAdminAuthHeaders } from "@/features/admin/lib/admin-auth";
import { getApiUrl, parseApiError } from "@/lib/api/client";

export async function getAdminBookings(): Promise<AdminBookingDto[]> {
  const response = await fetch(getApiUrl("admin/bookings"), {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de recuperer les reservations.",
    );
  }

  return response.json();
}

export async function getAdminBookingById(
  bookingId: string,
): Promise<AdminBookingDetailDto> {
  const response = await fetch(getApiUrl(`admin/bookings/${bookingId}`), {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de recuperer la reservation.",
    );
  }

  return response.json();
}

export async function createAdminBooking(
  payload: CreateAdminBookingPayload,
): Promise<CreateAdminBookingResponse> {
  const response = await fetch(getApiUrl("admin/bookings"), {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      guestPhone: payload.guestPhone?.trim()
        ? payload.guestPhone.trim()
        : undefined,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
      paymentNote: payload.paymentNote?.trim()
        ? payload.paymentNote.trim()
        : undefined,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de creer la reservation.",
    );
  }

  return response.json();
}

export async function updateAdminBooking(
  bookingId: string,
  payload: UpdateAdminBookingPayload,
): Promise<AdminBookingDetailDto> {
  const response = await fetch(getApiUrl(`admin/bookings/${bookingId}`), {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      guestPhone: payload.guestPhone?.trim()
        ? payload.guestPhone.trim()
        : undefined,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
      paymentNote: payload.paymentNote?.trim()
        ? payload.paymentNote.trim()
        : undefined,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de modifier la reservation.",
    );
  }

  return response.json();
}

export async function cancelAdminBooking(
  bookingId: string,
): Promise<AdminBookingDetailDto> {
  const response = await fetch(
    getApiUrl(`admin/bookings/${bookingId}/cancel`),
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible d'annuler la reservation.",
    );
  }

  return response.json();
}

export async function assignAdminBookingRoom(
  bookingId: string,
  payload: AssignAdminBookingRoomPayload,
): Promise<AdminBookingDetailDto> {
  const response = await fetch(
    getApiUrl(`admin/bookings/${bookingId}/assign-room`),
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de reassigner la chambre.",
    );
  }

  return response.json();
}