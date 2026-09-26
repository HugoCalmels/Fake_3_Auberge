import { ServiceUnavailableException } from '@nestjs/common';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaServiceMock {},
}));

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok when the database answers', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('returns 503 when the database is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('down')),
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
