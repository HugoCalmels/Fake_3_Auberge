import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [PrismaModule, BookingsModule, AuthModule, AdminModule],
})
export class AppModule {}
