import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';

@Controller('admin/invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Get('bookings/:bookingId/pdf')
  async downloadBookingInvoicePdf(
    @Param('bookingId') bookingId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.getPdfForBooking(bookingId);
    const buffer = await this.invoicePdfService.generateForInvoice(invoice.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.number}.pdf"`,
    );

    return res.send(buffer);
  }
}