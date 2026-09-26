import { isReservedTestEmail } from './test-email.util';

describe('isReservedTestEmail', () => {
  it.each([
    'e2e@example.com',
    'Someone@EXAMPLE.ORG',
    'qa@shop.test',
    'x@foo.invalid',
  ])('treats %s as a test address', (email) => {
    expect(isReservedTestEmail(email)).toBe(true);
  });

  it.each([
    'client@gmail.com',
    'contact@example.fr',
    'hello@notexample.com',
    'a@testing.com',
  ])('treats %s as a real address', (email) => {
    expect(isReservedTestEmail(email)).toBe(false);
  });
});
