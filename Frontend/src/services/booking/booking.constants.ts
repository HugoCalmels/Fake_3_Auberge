import { RoomType } from "./booking.types";


export const ROOM_TYPES: RoomType[] = [
  {
    id: "simple",
    name: "Chambre simple",
    lowSeasonAdult: 49,
    highSeasonAdult: 59,
    lowSeasonChild: 18,
    highSeasonChild: 24,
  },
  {
    id: "double",
    name: "Chambre double",
    lowSeasonAdult: 39,
    highSeasonAdult: 49,
    lowSeasonChild: 18,
    highSeasonChild: 24,
  },
  {
    id: "twin",
    name: "Chambre twin",
    lowSeasonAdult: 37,
    highSeasonAdult: 47,
    lowSeasonChild: 18,
    highSeasonChild: 24,
  },
  {
    id: "familiale",
    name: "Chambre familiale",
    lowSeasonAdult: 35,
    highSeasonAdult: 44,
    lowSeasonChild: 16,
    highSeasonChild: 22,
  },
  {
    id: "pmr",
    name: "Chambre PMR",
    lowSeasonAdult: 39,
    highSeasonAdult: 49,
    lowSeasonChild: 18,
    highSeasonChild: 24,
  },
];