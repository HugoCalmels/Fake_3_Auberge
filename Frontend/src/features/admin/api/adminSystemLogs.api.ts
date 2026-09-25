import { getAdminAuthHeaders } from "@/features/admin/lib/admin-auth";
import { getApiUrl, parseApiError } from "@/lib/api/client";
import type { AdminSystemLogDto } from "@/features/admin/types";

export async function getAdminSystemLogs(limit = 150) {
  const search = new URLSearchParams({
    limit: String(limit),
  });

  const response = await fetch(
    getApiUrl(`admin/system-logs?${search.toString()}`),
    {
      method: "GET",
      headers: getAdminAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer le journal système.",
    );
  }

  return (await response.json()) as AdminSystemLogDto[];
}