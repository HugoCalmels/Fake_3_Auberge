import { BookingStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type AdminBookingWithRelations = {
  id: string;
  roomId: string;
  mealPlanId: string | null;
  startDate: Date;
  endDate: Date;
  persons: number;
  adultMeals: number;
  childMeals: number;
  guestName: string;
  guestEmail: string;
  status: BookingStatus;
  notes: string | null;
  roomPrice: number;
  mealPlanPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  room: {
    number: string;
    roomType: {
      name: string;
    };
  };
  mealPlan?: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export function mapAdminBooking(booking: any) {
  return {
    id: booking.id,
    roomId: booking.roomId,
    roomNumber: booking.room.number,
    roomTypeName: booking.room.roomType.name,

    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,

    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    adults: booking.adultMeals,
    children: booking.childMeals,

    status: booking.status,
    notes: booking.notes,
    bookingSource: booking.bookingSource,

    paymentStatus: booking.paymentStatus,
    paymentNote: booking.paymentNote,

    mealPlanName: booking.mealPlan?.name ?? null,
    mealPlanCode: booking.mealPlan?.code ?? null,

    roomPrice: booking.roomPrice,
    mealPlanPrice: booking.mealPlanPrice,
    totalPrice: booking.totalPrice,

    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export function getNights(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function buildDayRange(from: Date, to: Date) {
  const days: string[] = [];
  const current = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );

  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

export function slugifyRoomTypeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function generateUniqueRoomTypeCode(
  prisma: PrismaService,
  name: string,
) {
  const baseCode = slugifyRoomTypeName(name) || 'room_type';

  let code = baseCode;
  let index = 2;

  while (
    await prisma.roomType.findUnique({
      where: { code },
      select: { id: true },
    })
  ) {
    code = `${baseCode}_${index}`;
    index += 1;
  }

  return code;
}