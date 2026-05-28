import { Injectable, InternalServerErrorException } from '@nestjs/common';

type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  replyTo?: {
    email: string;
    name?: string;
  };
  attachments?: {
    name: string;
    content: string;
  }[];
};

@Injectable()
export class MailerService {
  async sendEmail(input: SendEmailInput) {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const fromName = process.env.CONTACT_FROM_NAME || 'Auberge du Montcalm';

    if (!apiKey || !fromEmail) {
      throw new InternalServerErrorException('Configuration email manquante.');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: input.to,
            name: input.toName,
          },
        ],
        replyTo: input.replyTo,
        subject: input.subject,
        htmlContent: input.htmlContent,
        attachment: input.attachments,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      throw new InternalServerErrorException(
        `Impossible d’envoyer l’email. ${errorText}`,
      );
    }
  }

  async sendBookingConfirmation(input: {
    guestEmail: string;
    guestName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    bookingIds: string[];
    invoiceNumber?: string;
    invoicePdfBase64?: string;
  }) {
    await this.sendEmail({
      to: input.guestEmail,
      toName: input.guestName,
      subject: 'Confirmation de votre réservation',
      attachments: input.invoicePdfBase64
        ? [
            {
              name: `facture-${input.invoiceNumber}.pdf`,
              content: input.invoicePdfBase64,
            },
          ]
        : undefined,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Réservation confirmée</h2>

          <p>Bonjour ${escapeHtml(input.guestName)},</p>

          <p>Votre réservation est confirmée et votre paiement a bien été reçu.</p>

          <ul>
            <li><strong>Arrivée :</strong> ${formatDate(input.startDate)}</li>
            <li><strong>Départ :</strong> ${formatDate(input.endDate)}</li>
            <li><strong>Total payé :</strong> ${input.totalPrice} €</li>

            ${
              input.invoiceNumber
                ? `
                  <li>
                    <strong>Facture :</strong>
                    ${escapeHtml(input.invoiceNumber)}
                  </li>
                `
                : ''
            }
          </ul>

          ${
            input.invoiceNumber
              ? `
                <p>
                  Votre facture PDF est jointe à cet email.
                </p>
              `
              : ''
          }

          <p>À bientôt,<br />Auberge du Montcalm</p>
        </div>
      `,
    });
  }

  async sendBookingNotificationToAdmin(input: {
    guestEmail: string;
    guestName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    bookingIds: string[];
    invoiceNumber?: string;
    invoicePdfBase64?: string;
  }) {
    const toEmail = process.env.CONTACT_TO_EMAIL;

    if (!toEmail) return;

    await this.sendEmail({
      to: toEmail,
      toName: 'Auberge du Montcalm',
      subject: `Nouvelle réservation payée - ${input.guestName}`,
      attachments: input.invoicePdfBase64
        ? [
            {
              name: `facture-${input.invoiceNumber}.pdf`,
              content: input.invoicePdfBase64,
            },
          ]
        : undefined,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Nouvelle réservation payée</h2>

          <p><strong>Client :</strong> ${escapeHtml(input.guestName)}</p>
          <p><strong>Email :</strong> ${escapeHtml(input.guestEmail)}</p>
          <p><strong>Arrivée :</strong> ${formatDate(input.startDate)}</p>
          <p><strong>Départ :</strong> ${formatDate(input.endDate)}</p>
          <p><strong>Total payé :</strong> ${input.totalPrice} €</p>

          ${
            input.invoiceNumber
              ? `
                <p>
                  <strong>Facture :</strong>
                  ${escapeHtml(input.invoiceNumber)}
                </p>
              `
              : ''
          }

          <p><strong>Réservations :</strong> ${input.bookingIds.join(', ')}</p>
        </div>
      `,
    });
  }
}

function formatDate(value: Date) {
  return value.toLocaleDateString('fr-FR');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}