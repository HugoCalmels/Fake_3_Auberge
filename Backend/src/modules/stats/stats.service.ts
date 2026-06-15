import { Injectable } from "@nestjs/common";
import {
  BookingStatus,
  PaymentStatus,
} from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

const DAY_MS = 86_400_000;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const next30Days = new Date(now.getTime() + 30 * DAY_MS);

    const activeStatuses = [
      BookingStatus.confirmed,
      BookingStatus.checked_in,
      BookingStatus.checked_out,
    ];

    const [
      totalRooms,
      totalBookings,
      paidBookings,
      monthPaidBookings,
      upcomingBookings,
      forecastBookings,
      topRoomsRaw,
      roomTypesRaw,
    ] = await Promise.all([
      this.prisma.room.count(),

      this.prisma.booking.count(),

      this.prisma.booking.findMany({
        where: {
          paymentStatus: PaymentStatus.paid,
          status: { in: activeStatuses },
        },
        select: {
          totalPrice: true,
          startDate: true,
          endDate: true,
        },
      }),

      this.prisma.booking.findMany({
        where: {
          paymentStatus: PaymentStatus.paid,
          status: { in: activeStatuses },
          startDate: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: {
          totalPrice: true,
          startDate: true,
          endDate: true,
        },
      }),

      this.prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.pending, BookingStatus.confirmed],
          },
          startDate: {
            gte: now,
          },
        },
      }),

      this.prisma.booking.findMany({
        where: {
          status: {
            in: [BookingStatus.pending, BookingStatus.confirmed],
          },
          startDate: {
            gte: now,
            lt: next30Days,
          },
        },
        select: {
          totalPrice: true,
          startDate: true,
          endDate: true,
          paymentStatus: true,
        },
      }),

      this.prisma.booking.groupBy({
        by: ["roomId"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 5,
      }),

      this.prisma.booking.findMany({
        where: {
          status: { in: activeStatuses },
        },
        select: {
          room: {
            select: {
              roomType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const monthlyRevenue = sum(monthPaidBookings.map((booking) => booking.totalPrice));

    const totalRevenue = sum(paidBookings.map((booking) => booking.totalPrice));

    const averageBasket =
      paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0;

    const monthSoldNights = sum(
      monthPaidBookings.map((booking) =>
        getNightsWithinRange(
          booking.startDate,
          booking.endDate,
          monthStart,
          monthEnd,
        ),
      ),
    );

    const daysInMonth = Math.ceil(
      (monthEnd.getTime() - monthStart.getTime()) / DAY_MS,
    );

    const occupancyRate =
      totalRooms > 0
        ? Math.round((monthSoldNights / (totalRooms * daysInMonth)) * 100)
        : 0;

    const forecastSoldNights = sum(
      forecastBookings.map((booking) =>
        getNightsWithinRange(booking.startDate, booking.endDate, now, next30Days),
      ),
    );

    const forecastRevenue = sum(
      forecastBookings.map((booking) => booking.totalPrice),
    );

    const forecastOccupancyRate =
      totalRooms > 0
        ? Math.round((forecastSoldNights / (totalRooms * 30)) * 100)
        : 0;

    const reservationsByMonth = buildReservationsByMonth(paidBookings);

    const topRooms = await Promise.all(
      topRoomsRaw.map(async (item) => {
        const room = await this.prisma.room.findUnique({
          where: { id: item.roomId },
          select: { number: true },
        });

        return {
          roomNumber: room?.number ?? "—",
          bookings: item._count.id,
        };
      }),
    );

    const roomDistribution = buildRoomDistribution(roomTypesRaw);

    return {
      monthlyRevenue,
      totalBookings,
      occupancyRate,
      averageBasket,

      reservationsByMonth,
      roomDistribution,
      topRooms,

      forecast: {
        upcomingBookings,
        soldNights: forecastSoldNights,
        expectedRevenue: forecastRevenue,
        occupancyRate: forecastOccupancyRate,
      },
    };
  }
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getNightsWithinRange(
  startDate: Date,
  endDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const start = new Date(Math.max(startDate.getTime(), rangeStart.getTime()));
  const end = new Date(Math.min(endDate.getTime(), rangeEnd.getTime()));

  if (end <= start) return 0;

  return Math.ceil((end.getTime() - start.getTime()) / DAY_MS);
}

function buildReservationsByMonth(
  bookings: Array<{ startDate: Date }>,
): Array<{ label: string; value: number }> {
  const now = new Date();
  const year = now.getFullYear();

  return Array.from({ length: 12 }, (_, monthIndex) => {
    const count = bookings.filter((booking) => {
      const bookingDate = booking.startDate;

      return (
        bookingDate.getFullYear() === year &&
        bookingDate.getMonth() === monthIndex
      );
    }).length;

    return {
      label: new Date(year, monthIndex, 1).toLocaleDateString("fr-FR", {
        month: "short",
      }),
      value: count,
    };
  });
}

function buildRoomDistribution(
  bookings: Array<{ room: { roomType: { name: string } } }>,
): Array<{ label: string; value: number }> {
  const total = bookings.length;
  const counts = new Map<string, number>();

  for (const booking of bookings) {
    const name = booking.room.roomType.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
}