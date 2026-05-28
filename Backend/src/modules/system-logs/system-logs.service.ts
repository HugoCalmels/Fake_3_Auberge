import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SystemLogLevel } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CreateSystemLogInput = {
  level?: SystemLogLevel;
  type: string;
  message: string;
  bookingId?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSystemLogInput) {
    try {
      return await this.prisma.systemLog.create({
        data: {
          level: input.level ?? SystemLogLevel.info,
          type: input.type,
          message: input.message,
          bookingId: input.bookingId,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        `Impossible de créer un SystemLog: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return null;
    }
  }

  async getLatest(limit = 150) {
    return this.prisma.systemLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(Math.max(limit, 1), 300),
    });
  }
}