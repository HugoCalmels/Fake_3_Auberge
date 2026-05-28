import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type LoginAttemptRecord = {
  count: number;
  lockedUntil: number;
  firstAttemptAt: number;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class LoginAttemptService {
  private readonly attempts = new Map<string, LoginAttemptRecord>();

  ensureAllowed(key: string) {
    const attempt = this.attempts.get(key);

    if (!attempt) {
      return;
    }

    const now = Date.now();

    if (attempt.lockedUntil > now) {
      throw new HttpException(
        'Trop de tentatives. Reessayez dans quelques minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
      this.attempts.delete(key);
    }
  }

  recordFailure(key: string) {
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
      this.attempts.set(key, {
        count: 1,
        lockedUntil: 0,
        firstAttemptAt: now,
      });
      return;
    }

    const nextCount = current.count + 1;

    this.attempts.set(key, {
      count: nextCount,
      lockedUntil: nextCount >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_WINDOW_MS : 0,
      firstAttemptAt: current.firstAttemptAt,
    });
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}
