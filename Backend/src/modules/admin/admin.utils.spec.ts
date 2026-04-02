import { buildDayRange, getNights, mapAdminBooking } from './admin.utils';

describe('admin.utils', () => {
  it('maps an admin booking for API responses', () => {
    const booking = mapAdminBooking({
      id: 'booking_1',
      roomId: 'room_1',
      mealPlanId: 'meal_1',
      startDate: new Date('2026-04-10T00:00:00.000Z'),
      endDate: new Date('2026-04-12T00:00:00.000Z'),
      persons: 2,
      adultMeals: 2,
      childMeals: 0,
      guestName: 'Jean Dupont',
      guestEmail: 'jean@example.com',
      status: 'confirmed',
      notes: 'Late arrival',
      roomPrice: 170,
      mealPlanPrice: 72,
      totalPrice: 242,
      createdAt: new Date('2026-04-01T09:00:00.000Z'),
      updatedAt: new Date('2026-04-02T09:00:00.000Z'),
      room: {
        number: '101',
        roomType: {
          name: 'Chambre double',
        },
      },
      mealPlan: {
        id: 'meal_1',
        name: 'Demi-pension',
        code: 'half_board',
      },
    });

    expect(booking).toMatchObject({
      id: 'booking_1',
      roomNumber: '101',
      roomTypeName: 'Chambre double',
      mealPlanName: 'Demi-pension',
      mealPlanCode: 'half_board',
      guestName: 'Jean Dupont',
      status: 'confirmed',
      totalPrice: 242,
    });
    expect(booking.startDate).toBe('2026-04-10T00:00:00.000Z');
    expect(booking.createdAt).toBe('2026-04-01T09:00:00.000Z');
  });

  it('returns the number of nights between two dates', () => {
    expect(getNights(new Date('2026-04-10'), new Date('2026-04-12'))).toBe(2);
  });

  it('builds an inclusive day range', () => {
    expect(
      buildDayRange(new Date('2026-04-10'), new Date('2026-04-12')),
    ).toEqual(['2026-04-10', '2026-04-11', '2026-04-12']);
  });
});
