import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForInvoice(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        bookingGroupId: invoice.bookingGroupId,
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      // Header
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Auberge du Fauxcalm', 50, 50);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('12 route du Montcalm', 50, 80)
        .text('09220 Auzat, France', 50, 94)
        .text('contact@auberge-du-fauxcalm.fr', 50, 108)
        .text('SIRET : 123 456 789 00012', 50, 122)
        .text('TVA intracommunautaire : FR12 123456789', 50, 136);

      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('FACTURE', 390, 50, {
          width: 155,
          align: 'right',
        });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.number, 390, 82, {
          width: 155,
          align: 'right',
        })
        .text(`Émise le ${formatDate(invoice.issuedAt)}`, 390, 98, {
          width: 155,
          align: 'right',
        });

      // Separator
      doc
        .moveTo(50, 165)
        .lineTo(545, 165)
        .strokeColor('#cccccc')
        .stroke();

      // Client block
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Facturé à', 50, 190);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.guestName, 50, 210)
        .text(invoice.guestEmail, 50, 225);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Référence réservation', 330, 190)
        .font('Helvetica-Bold')
        .text(invoice.bookingGroupId, 330, 207, {
          width: 215,
        });

      if (invoice.stripePaymentIntentId) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Référence paiement', 330, 235)
          .font('Helvetica-Bold')
          .text(invoice.stripePaymentIntentId, 330, 252, {
            width: 215,
          });
      }

      // Table title
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Détail du séjour', 50, 300);

      const tableTop = 330;
      const rowHeight = 28;

      const cols = {
        description: 50,
        qty: 295,
        unit: 345,
        total: 455,
      };

      // Table header
      doc
        .rect(50, tableTop, contentWidth, rowHeight)
        .fill('#f2f2f2');

      doc
        .fillColor('#111111')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Description', cols.description + 8, tableTop + 10)
        .text('Qté', cols.qty, tableTop + 10, { width: 40, align: 'right' })
        .text('Prix unitaire', cols.unit, tableTop + 10, {
          width: 80,
          align: 'right',
        })
        .text('Total', cols.total, tableTop + 10, {
          width: 90,
          align: 'right',
        });

      let y = tableTop + rowHeight;

      for (const booking of bookings) {
        const nights = getNights(booking.startDate, booking.endDate);
        const lineTitle = `Chambre ${booking.room.number} - ${booking.room.roomType.name}`;
        const lineSubtitle = `${formatDate(booking.startDate)} au ${formatDate(
          booking.endDate,
        )} · ${booking.persons} personne(s) · ${
          booking.mealPlan?.name ?? 'Sans formule'
        }`;

        if (y > 700) {
          doc.addPage();
          y = 60;
        }

        doc
          .rect(50, y, contentWidth, 54)
          .strokeColor('#e5e5e5')
          .stroke();

        doc
          .fillColor('#111111')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(lineTitle, cols.description + 8, y + 9, {
            width: 230,
          });

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#555555')
          .text(lineSubtitle, cols.description + 8, y + 24, {
            width: 230,
          });

        doc
          .fillColor('#111111')
          .fontSize(9)
          .font('Helvetica')
          .text(`${nights}`, cols.qty, y + 18, {
            width: 40,
            align: 'right',
          })
          .text(formatCurrency(Math.round(booking.totalPrice / nights)), cols.unit, y + 18, {
            width: 80,
            align: 'right',
          })
          .font('Helvetica-Bold')
          .text(formatCurrency(booking.totalPrice), cols.total, y + 18, {
            width: 90,
            align: 'right',
          });

        y += 54;
      }

      // Totals
      y += 25;

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#111111')
        .text('Sous-total', 360, y, { width: 90, align: 'right' })
        .text(formatCurrency(invoice.totalPrice), 455, y, {
          width: 90,
          align: 'right',
        });

      y += 18;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('TVA incluse', 360, y, { width: 90, align: 'right' })
        .text('0,00 €', 455, y, {
          width: 90,
          align: 'right',
        });

      y += 25;

      doc
        .rect(350, y, 195, 34)
        .fill('#111111');

      doc
        .fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total payé', 365, y + 11)
        .text(formatCurrency(invoice.totalPrice), 455, y + 11, {
          width: 75,
          align: 'right',
        });

      // Footer
      doc
        .fillColor('#666666')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Facture générée automatiquement après paiement confirmé. Aucun paiement supplémentaire n’est dû.',
          50,
          760,
          {
            width: contentWidth,
            align: 'center',
          },
        )
        .text(
          'Auberge du Fauxcalm · SIRET 123 456 789 00012 · TVA FR12 123456789',
          50,
          775,
          {
            width: contentWidth,
            align: 'center',
          },
        );

      doc.end();
    });
  }
}

function formatDate(value: Date) {
  return value.toLocaleDateString('fr-FR');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function getNights(startDate: Date, endDate: Date) {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}