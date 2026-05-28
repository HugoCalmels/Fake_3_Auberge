import type { AdminSystemLogDto } from "@/features/admin/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getAdminSystemLogs(limit = 150) {
  const search = new URLSearchParams({
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/admin/system-logs?${search.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de récupérer le journal système.");
  }

  return (await response.json()) as AdminSystemLogDto[];
}