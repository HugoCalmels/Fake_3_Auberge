import { BadRequestException } from '@nestjs/common';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaServiceMock {},
}));

import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  it('rejects an invalid availability range', async () => {
    const service = new BookingsService({} as never);

    await expect(
      service.getAvailability({
        startDate: '2026-04-12',
        endDate: '2026-04-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a booking and computes pricing', async () => {
    const tx = {
      roomType: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'rt_1',
          code: 'double',
          name: 'Chambre double',
          maxCapacity: 2,
          basePrice: 85,
        }),

        findUnique: jest.fn().mockResolvedValue({
          id: 'rt_1',
          code: 'double',
          name: 'Chambre double',
          maxCapacity: 2,
          basePrice: 85,
        }),
      },

      mealPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'mp_1',
          code: 'half_board',
          name: 'Demi-pension',
          adultPrice: 18,
          childPrice: 12,
        }),
      },

      roomTypeMealPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'link_1',
        }),
      },

      room: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'room_101',
            number: '101',
          },
        ]),
      },

      booking: {
        findFirst: jest.fn().mockResolvedValue(null),

        create: jest.fn().mockResolvedValue({
          id: 'booking_1',
          roomId: 'room_101',
          roomPrice: 170,
          mealPlanPrice: 72,
          totalPrice: 242,
        }),
      },
    };

    const prisma = {
      $transaction: jest.fn((callback: (mockTx: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new BookingsService(prisma as never);

    await expect(
      service.createBooking({
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        guestName: 'Jean Dupont',
        guestEmail: 'JEAN@EXAMPLE.COM',
        selections: [
          {
            roomTypeId: 'double',
            adults: 2,
            children: 0,
            mealPlanCode: 'half_board',
          },
        ],
      }),
    ).resolves.toMatchObject({
      success: true,
      selectionCount: 1,
      pricing: {
        nights: 2,
        roomPrice: 170,
        mealPlanPrice: 72,
        totalPrice: 242,
      },
    });

    expect(tx.booking.create).toHaveBeenCalled();

    const bookingCreateCall = tx.booking.create.mock.calls[0][0];

    expect(bookingCreateCall.data.guestEmail).toBe('jean@example.com');
    expect(bookingCreateCall.data.status).toBe('pending');
    expect(bookingCreateCall.data.paymentStatus).toBe('unpaid');
    expect(bookingCreateCall.data.totalPrice).toBe(242);
  });
});