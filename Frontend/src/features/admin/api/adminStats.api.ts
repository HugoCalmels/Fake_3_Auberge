import { getAdminAuthHeaders } from "@/features/admin/lib/admin-auth";
import { getApiUrl, parseApiError } from "@/lib/api/client";

export type AdminStatsDashboardDto = {
  monthlyRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  averageBasket: number;
  reservationsByMonth: Array<{
    label: string;
    value: number;
  }>;
  roomDistribution: Array<{
    label: string;
    value: number;
  }>;
  topRooms: Array<{
    roomNumber: string;
    bookings: number;
  }>;
  forecast: {
    upcomingBookings: number;
    soldNights: number;
    expectedRevenue: number;
    occupancyRate: number;
  };
};

export async function getAdminStats(): Promise<AdminStatsDashboardDto> {
  const response = await fetch(getApiUrl("admin/stats"), {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les statistiques.",
    );
  }

  return response.json();
}