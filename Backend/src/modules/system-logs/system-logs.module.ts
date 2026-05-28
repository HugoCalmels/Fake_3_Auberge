import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogsService } from './system-logs.service';

@Module({
  controllers: [SystemLogsController],
  providers: [SystemLogsService, PrismaService],
  exports: [SystemLogsService],
})
export class SystemLogsModule {}