import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContactModule } from './modules/contact/contact.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [PrismaModule, BookingsModule, AuthModule, AdminModule, ContactModule, PaymentsModule, SystemLogsModule, StatsModule],
})
export class AppModule {}
