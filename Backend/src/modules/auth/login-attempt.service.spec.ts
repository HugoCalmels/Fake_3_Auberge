import { HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginAttemptService } from './login-attempt.service';

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;

  const prisma = {
    loginAttempt: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoginAttemptService(prisma as unknown as PrismaService);
  });

  describe('ensureAllowed', () => {
    it('does nothing when there is no prior attempt', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.ensureAllowed('1.2.3.4:a@b.com'),
      ).resolves.toBeUndefined();
      expect(prisma.loginAttempt.delete).not.toHaveBeenCalled();
    });

    it('throws 429 while locked', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue({
        key: '1.2.3.4:a@b.com',
        count: 5,
        lockedUntil: new Date(Date.now() + 60_000),
        firstAttemptAt: new Date(),
      });

      await expect(
        service.ensureAllowed('1.2.3.4:a@b.com'),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('clears a stale attempt outside the window without throwing', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue({
        key: '1.2.3.4:a@b.com',
        count: 5,
        lockedUntil: null,
        firstAttemptAt: new Date(Date.now() - 20 * 60 * 1000),
      });
      prisma.loginAttempt.delete.mockResolvedValue({});

      await expect(
        service.ensureAllowed('1.2.3.4:a@b.com'),
      ).resolves.toBeUndefined();
      expect(prisma.loginAttempt.delete).toHaveBeenCalledWith({
        where: { key: '1.2.3.4:a@b.com' },
      });
    });
  });

  describe('recordFailure', () => {
    it('creates a fresh attempt record when none exists', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue(null);
      prisma.loginAttempt.upsert.mockResolvedValue({});

      await service.recordFailure('1.2.3.4:a@b.com');

      expect(prisma.loginAttempt.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: '1.2.3.4:a@b.com' },
          create: expect.objectContaining({ count: 1, lockedUntil: null }),
          update: expect.objectContaining({ count: 1, lockedUntil: null }),
        }),
      );
    });

    it('increments the counter without locking below the threshold', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue({
        key: '1.2.3.4:a@b.com',
        count: 2,
        lockedUntil: null,
        firstAttemptAt: new Date(),
      });
      prisma.loginAttempt.update.mockResolvedValue({});

      await service.recordFailure('1.2.3.4:a@b.com');

      expect(prisma.loginAttempt.update).toHaveBeenCalledWith({
        where: { key: '1.2.3.4:a@b.com' },
        data: { count: 3, lockedUntil: null },
      });
    });

    it('locks once the max attempt count is reached', async () => {
      prisma.loginAttempt.findUnique.mockResolvedValue({
        key: '1.2.3.4:a@b.com',
        count: 4,
        lockedUntil: null,
        firstAttemptAt: new Date(),
      });
      prisma.loginAttempt.update.mockResolvedValue({});

      await service.recordFailure('1.2.3.4:a@b.com');

      expect(prisma.loginAttempt.update).toHaveBeenCalledWith({
        where: { key: '1.2.3.4:a@b.com' },
        data: { count: 5, lockedUntil: expect.any(Date) },
      });
    });
  });

  describe('reset', () => {
    it('deletes the attempt record', async () => {
      prisma.loginAttempt.delete.mockResolvedValue({});

      await service.reset('1.2.3.4:a@b.com');

      expect(prisma.loginAttempt.delete).toHaveBeenCalledWith({
        where: { key: '1.2.3.4:a@b.com' },
      });
    });

    it('does not throw if there was nothing to delete', async () => {
      prisma.loginAttempt.delete.mockRejectedValue(new Error('not found'));

      await expect(service.reset('1.2.3.4:a@b.com')).resolves.toBeUndefined();
    });
  });
});
