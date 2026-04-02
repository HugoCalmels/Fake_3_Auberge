const API_BASE_URL = "http://localhost:3001";

export type RoomTypeId =
  | "simple"
  | "double"
  | "twin"
  | "familiale"
  | "pmr";

export type CheckAvailabilityPayload = {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  rooms: number;
  roomTypeId: RoomTypeId;
};

export type CheckAvailabilityResponse = {
  isAvailable: boolean;
  availableRoomsCount: number;
  matchingRoomIds: string[];
  message: string;
};

export async function checkAvailability(
  payload: CheckAvailabilityPayload
): Promise<CheckAvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/availability/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || "Erreur lors de la vérification de disponibilité."
    );
  }

  return response.json();
}