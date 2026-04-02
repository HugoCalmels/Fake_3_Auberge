export type BookingStep = 1 | 2 | 3 | 4;

export type BookingSupplement = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type BookingOffer = {
  id: string;
  roomTypeId: string;
  title: string;
  capacityLabel: string;
  shortDescription: string;
  image?: string;
  basePrice: number;
  formulas?: {
    id: string;
    name: string;
    priceDelta: number;
  }[];
};