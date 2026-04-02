import type { AdminRoomDto } from "@/features/admin/types";

export function sortRooms(a: AdminRoomDto, b: AdminRoomDto) {
  if (a.floor !== b.floor) return a.floor - b.floor;
  return a.number.localeCompare(b.number);
}
