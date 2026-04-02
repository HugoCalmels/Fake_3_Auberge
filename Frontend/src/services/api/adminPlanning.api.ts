import type { AdminPlanningResponse } from "./admin.types";
import {
  getAdminAuthHeaders,
  getApiBaseUrl,
  parseApiError,
} from "./api.utils";

const API_BASE_URL = getApiBaseUrl();

export async function getAdminPlanning(
  from: string,
  to: string
): Promise<AdminPlanningResponse> {
  const params = new URLSearchParams({ from, to });

  const response = await fetch(`${API_BASE_URL}/admin/planning?${params}`, {
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