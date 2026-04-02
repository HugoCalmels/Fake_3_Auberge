const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getApiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
}

export async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
  const data = await response.json().catch(() => null);

  const message =
    typeof data?.message === "string"
      ? data.message
      : Array.isArray(data?.message)
        ? data.message.join(", ")
        : fallbackMessage;

  return new Error(message);
}
