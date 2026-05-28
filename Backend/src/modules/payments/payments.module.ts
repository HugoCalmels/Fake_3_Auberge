import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { BookingsModule } from '../bookings/bookings.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PendingBookingsCleanupService } from './pending-bookings-cleanup.service';
import { MailerModule } from '../mailer/mailer.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [BookingsModule, SystemLogsModule, MailerModule, InvoicesModule],
  controllers: [PaymentsController],
  providers: [
    PrismaService,
    PaymentsService,
    PendingBookingsCleanupService,

  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}