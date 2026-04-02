// src/services/api/adminStats.api.ts

import type { AdminDashboardStatsDto } from "./admin.types";
import { getAdminAuthHeaders, getApiBaseUrl, parseApiError } from "./api.utils";


const API_BASE_URL = getApiBaseUrl();

export async function getAdminDashboardStats(): Promise<AdminDashboardStatsDto> {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    method: "GET",
    headers: getAdminAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les statistiques."
    );
  }

  return response.json();
}