import type { MealPlanCode } from "@/features/booking/api/bookings.api";

export type AdminRoomStatus = "available" | "occupied" | "maintenance";

export type AdminRoomTypeDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  imageUrl?: string | null;
};

export type CreateAdminRoomTypePayload = {
  code: string;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  imageUrl?: string;
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
  | "no_show"
  | "cancelled";

export type AdminPaymentStatus = "unpaid" | "paid";

export type AdminBookingDto = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  status: AdminBookingStatus;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
  paymentStatus?: AdminPaymentStatus;
  paymentNote?: string | null;
};

export type AdminBookingDetailDto = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  status: AdminBookingStatus;
  notes?: string | null;
  paymentStatus: AdminPaymentStatus;
  paymentNote?: string | null;
  mealPlanName?: string | null;
  roomPrice?: number;
  mealPlanPrice?: number;
  totalPrice?: number;
  mealPlanCode?: MealPlanCode | null;
};

export type CreateAdminBookingSelectionPayload = {
  roomTypeId: string;
  adults: number;
  children: number;
  mealPlanCode: MealPlanCode;
};

export type CreateAdminBookingPayload = {
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string;
  paymentStatus: AdminPaymentStatus;
  paymentNote?: string;
  createdBy: "admin" | "visitor";
  selections: CreateAdminBookingSelectionPayload[];
};

export type CreateAdminBookingResponse = {
  success: boolean;
  message: string;
  bookingIds: string[];
  roomIds: string[];
  selectionCount: number;
  pricing: {
    nights: number;
    roomPrice: number;
    mealPlanPrice: number;
    totalPrice: number;
  };
};

export type UpdateAdminBookingPayload = {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  guestPhone?: string;
  notes?: string;
  status?: AdminBookingStatus;
  paymentStatus?: AdminPaymentStatus;
  paymentNote?: string;
  mealPlanCode?: MealPlanCode;
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
  | "reservations-planning"
  | "bookings-list"
  | "rooms"
  | "roomTypes"
  | "stats"
  | "system-logs";

export type UpdateAdminRoomTypePayload = {
  name?: string;
  description?: string;
  maxCapacity?: number;
  basePrice?: number;
  imageUrl?: string;
};

export type AdminSystemLogType =
  | "website_booking_validated"
  | "website_booking_failed"
  | "admin_booking_created"
  | "admin_booking_deleted"
  | "booking_check_in"
  | "booking_check_out";

export type AdminSystemLogDto = {
  id: string;
  type: AdminSystemLogType;
  message?: string | null;
  bookingId?: string | null;
  bookingGroupId?: string | null;
  metadata?: unknown;
  createdAt: string;
};