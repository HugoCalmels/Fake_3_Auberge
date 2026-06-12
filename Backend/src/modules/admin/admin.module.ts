import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [PrismaModule, SystemLogsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
