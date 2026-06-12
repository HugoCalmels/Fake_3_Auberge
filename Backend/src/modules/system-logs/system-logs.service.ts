import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SystemLogType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CreateSystemLogInput = {
  type: SystemLogType;
  message?: string;
  bookingId?: string;
  bookingGroupId?: string;
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
          type: input.type,
          message: input.message,
          bookingId: input.bookingId,
          bookingGroupId: input.bookingGroupId,
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