const API_BASE_URL = "http://localhost:3001";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAdminBookings() {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les réservations.");
  }

  return response.json();
}