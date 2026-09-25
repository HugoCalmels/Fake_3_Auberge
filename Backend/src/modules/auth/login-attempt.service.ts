import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAllowed(key: string) {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { key },
    });

    if (!attempt) {
      return;
    }

    const now = new Date();

    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      throw new HttpException(
        'Trop de tentatives. Reessayez dans quelques minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (now.getTime() - attempt.firstAttemptAt.getTime() > LOGIN_WINDOW_MS) {
      await this.prisma.loginAttempt.delete({ where: { key } }).catch(() => {
        // Already reset by a concurrent request — nothing to do.
      });
    }
  }

  async recordFailure(key: string) {
    const now = new Date();
    const current = await this.prisma.loginAttempt.findUnique({
      where: { key },
    });

    if (
      !current ||
      now.getTime() - current.firstAttemptAt.getTime() > LOGIN_WINDOW_MS
    ) {
      await this.prisma.loginAttempt.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          lockedUntil: null,
          firstAttemptAt: now,
        },
        update: {
          count: 1,
          lockedUntil: null,
          firstAttemptAt: now,
        },
      });
      return;
    }

    const nextCount = current.count + 1;

    await this.prisma.loginAttempt.update({
      where: { key },
      data: {
        count: nextCount,
        lockedUntil:
          nextCount >= MAX_LOGIN_ATTEMPTS
            ? new Date(now.getTime() + LOGIN_WINDOW_MS)
            : null,
      },
    });
  }

  async reset(key: string) {
    await this.prisma.loginAttempt.delete({ where: { key } }).catch(() => {
      // Nothing to reset.
    });
  }
}
