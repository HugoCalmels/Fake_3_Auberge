export type AdminRoomStatus = "available" | "occupied" | "maintenance";

export type AdminRoomTypeDto = {
  id: string;
  code: string;
  name: string;
  capacity: number;
};

export type CreateAdminRoomTypePayload = {
  code: string;
  name: string;
  capacity: number;
};

export type AdminRoomDto = {
  id: string;
  number: string;
  floor: number;
  roomTypeId: string;
  status: AdminRoomStatus;
};

export type AdminBookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type AdminBookingDto = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName?: string;
  guestName: string;
  guestEmail: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  status: AdminBookingStatus;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
};

export type AdminBookingDetailDto = AdminBookingDto & {
  notes?: string | null;
};

export type CreateAdminBookingPayload = {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  roomId: string;
  notes?: string;
};

export type UpdateAdminBookingPayload = {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  notes?: string;
};

export type AssignAdminBookingRoomPayload = {
  roomId: string;
};

export type AdminDashboardStatsDto = {
  arrivalsToday: number;
  departuresToday: number;
  currentGuests: number;
  bookingsUpcoming: number;
  availableRoomsToday: number;
  occupiedRoomsToday: number;
  maintenanceRooms: number;
};

export type AdminPlanningBookingDto = {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  startDate: string;
  endDate: string;
  status: AdminBookingStatus;
};

export type AdminPlanningRoomDto = {
  id: string;
  number: string;
  floor: number;
  roomTypeName?: string;
  status: AdminRoomStatus;
};

export type AdminPlanningResponse = {
  from: string;
  to: string;
  days: string[];
  rooms: AdminPlanningRoomDto[];
  bookings: AdminPlanningBookingDto[];
};

export type AdminWorkspacePanel =
  | "reservations-dashboard"
  | "bookings-upcoming"
  | "bookings-current"
  | "bookings-history"
  | "rooms"
  | "roomTypes"
  | "stats";
