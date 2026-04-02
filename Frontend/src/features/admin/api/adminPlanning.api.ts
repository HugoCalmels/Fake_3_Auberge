import type { AdminPlanningResponse } from "@/features/admin/types";
import { getAdminAuthHeaders } from "@/features/admin/lib/admin-auth";
import { getApiUrl, parseApiError } from "@/lib/api/client";

export async function getAdminPlanning(
  from: string,
  to: string
): Promise<AdminPlanningResponse> {
  const params = new URLSearchParams({ from, to });

  const response = await fetch(getApiUrl(`admin/planning?${params}`), {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer le planning."
    );
  }

  return response.json();
}
