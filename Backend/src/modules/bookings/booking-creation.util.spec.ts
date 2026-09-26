import { BadRequestException } from '@nestjs/common';
import { computeLinePricing, parseStayDates } from './booking-creation.util';

describe('parseStayDates', () => {
  it('computes the number of nights', () => {
    expect(parseStayDates('2099-04-10', '2099-04-13').nights).toBe(3);
  });

  it.each([
    ['not-a-date', '2099-04-12'],
    ['2099-04-12', '2099-04-12'],
    ['2099-04-12', '2099-04-10'],
  ])('rejects %s -> %s', (start, end) => {
    expect(() => parseStayDates(start, end)).toThrow(BadRequestException);
  });
});

describe('computeLinePricing', () => {
  it('prices room and meals per night', () => {
    expect(
      computeLinePricing({
        basePrice: 85,
        mealPlan: { adultPrice: 18, childPrice: 12 },
        adults: 2,
        children: 1,
        nights: 2,
      }),
    ).toEqual({
      persons: 3,
      adultMeals: 2,
      childMeals: 1,
      roomPrice: 170,
      mealPlanPrice: 96,
      totalPrice: 266,
    });
  });

  it('room only costs nothing for meals', () => {
    expect(
      computeLinePricing({
        basePrice: 75,
        mealPlan: { adultPrice: 0, childPrice: 0 },
        adults: 1,
        children: 0,
        nights: 3,
      }).totalPrice,
    ).toBe(225);
  });
});
