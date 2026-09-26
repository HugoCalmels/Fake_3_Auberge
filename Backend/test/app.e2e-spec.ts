import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const DEMO_ADMIN_EMAIL = 'owner@auberge.com';
const DEMO_ADMIN_PASSWORD = 'admin123456';

function findRawCookie(
  setCookieHeader: string | string[] | undefined,
  name: string,
) {
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}

function cookiePair(rawCookie: string | undefined) {
  return rawCookie?.split(';')[0];
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health', () => {
    it('GET /health reports the API and database as up', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok', database: 'up' });
    });
  });

  describe('admin routes require authentication', () => {
    it.each([
      '/admin/bookings',
      '/admin/rooms',
      '/admin/room-types',
      '/admin/planning',
    ])('GET %s without a session is rejected', (path) => {
      return request(app.getHttpServer()).get(path).expect(401);
    });

    it('GET /admin/stats without a session is rejected', () => {
      return request(app.getHttpServer()).get('/admin/stats').expect(401);
    });

    it('GET /admin/system-logs without a session is rejected', () => {
      return request(app.getHttpServer()).get('/admin/system-logs').expect(401);
    });

    it('GET /admin/invoices/bookings/:id/pdf without a session is rejected', () => {
      return request(app.getHttpServer())
        .get('/admin/invoices/bookings/nonexistent-id/pdf')
        .expect(401);
    });
  });

  describe('auth session (httpOnly cookie)', () => {
    it('rejects an invalid password without setting a cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: DEMO_ADMIN_EMAIL, password: 'not-the-password' })
        .expect(401);

      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('logs in, reads /auth/me, unlocks /admin/stats, then logs out', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD })
        .expect(201);

      expect(loginResponse.body).toEqual({
        admin: expect.objectContaining({ email: DEMO_ADMIN_EMAIL }),
      });
      expect(loginResponse.body.admin.accessToken).toBeUndefined();

      const rawSessionCookie = findRawCookie(
        loginResponse.headers['set-cookie'],
        'admin_token',
      );
      expect(rawSessionCookie).toBeDefined();
      expect(rawSessionCookie).toContain('HttpOnly');

      const sessionCookie = cookiePair(rawSessionCookie);

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [sessionCookie!])
        .expect(200);
      expect(meResponse.body.email).toBe(DEMO_ADMIN_EMAIL);

      await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Cookie', [sessionCookie!])
        .expect(200);

      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [sessionCookie!])
        .expect(201);

      const clearedCookie = findRawCookie(
        logoutResponse.headers['set-cookie'],
        'admin_token',
      );
      expect(clearedCookie).toContain('admin_token=;');
    });
  });

  describe('brute-force lockout is persisted (not in-memory)', () => {
    const lockoutEmail = 'e2e-lockout-test@example.com';

    afterEach(async () => {
      await prisma.loginAttempt.deleteMany({
        where: { key: { endsWith: `:${lockoutEmail}` } },
      });
    });

    it('locks out after 5 failed attempts and returns 429', async () => {
      for (let i = 0; i < 4; i += 1) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: lockoutEmail, password: 'wrong-password' })
          .expect(401);
      }

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: lockoutEmail, password: 'wrong-password' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: lockoutEmail, password: 'wrong-password' })
        .expect(429);

      const stored = await prisma.loginAttempt.findMany({
        where: { key: { endsWith: `:${lockoutEmail}` } },
      });
      expect(stored).toHaveLength(1);
      expect(stored[0].count).toBeGreaterThanOrEqual(5);
      expect(stored[0].lockedUntil).not.toBeNull();
    });
  });

  describe('public booking flow', () => {
    const createdBookingIds: string[] = [];

    afterAll(async () => {
      if (createdBookingIds.length > 0) {
        await prisma.booking.deleteMany({
          where: { id: { in: createdBookingIds } },
        });
      }
    });

    it('lists public room types', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings/room-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('creates a pending booking end-to-end and prices it server-side', async () => {
      const roomTypes = await request(app.getHttpServer())
        .get('/bookings/room-types')
        .expect(200);

      const roomType = roomTypes.body[0];

      const availability = await request(app.getHttpServer())
        .get('/bookings/availability')
        .query({ startDate: '2027-03-10', endDate: '2027-03-12' })
        .expect(200);

      const availableRoomType = availability.body.roomTypes.find(
        (rt: { id: string; availableRooms: number }) =>
          rt.id === roomType.id && rt.availableRooms > 0,
      );
      expect(availableRoomType).toBeDefined();

      const createResponse = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          startDate: '2027-03-10',
          endDate: '2027-03-12',
          guestName: 'E2E Test Guest',
          guestEmail: 'e2e-guest@example.com',
          selections: [
            {
              roomTypeId: availableRoomType.id,
              adults: 1,
              children: 0,
              mealPlanCode: 'room_only',
            },
          ],
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.bookingIds).toHaveLength(1);
      expect(createResponse.body.pricing.nights).toBe(2);

      createdBookingIds.push(...createResponse.body.bookingIds);

      const stored = await prisma.booking.findUnique({
        where: { id: createResponse.body.bookingIds[0] },
      });
      expect(stored?.status).toBe('pending');
      expect(stored?.paymentStatus).toBe('unpaid');
    });

    it('rejects a website booking starting in the past', async () => {
      const roomTypes = await request(app.getHttpServer())
        .get('/bookings/room-types')
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          startDate: '2020-01-10',
          endDate: '2020-01-12',
          guestName: 'E2E Past Date',
          guestEmail: 'e2e-past@example.com',
          selections: [
            {
              roomTypeId: roomTypes.body[0].id,
              adults: 1,
              children: 0,
              mealPlanCode: 'room_only',
            },
          ],
        })
        .expect(400);

      expect(response.body.message).toContain('passé');
    });

    it('rejects a booking payload missing required guest fields', () => {
      return request(app.getHttpServer())
        .post('/bookings')
        .send({
          startDate: '2027-03-10',
          endDate: '2027-03-12',
          selections: [],
        })
        .expect(400);
    });
  });
});
