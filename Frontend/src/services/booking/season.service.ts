import { Season } from "./booking.types";


export function getSeason(startDate: string): Season {
  if (!startDate) return "low";

  const date = new Date(startDate);
  const month = date.getMonth() + 1;

  if (month >= 6 && month <= 9) {
    return "high";
  }

  return "low";
}