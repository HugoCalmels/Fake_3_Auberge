import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";

@Injectable()
export class ContactService {
  async sendContactMessage(dto: CreateContactMessageDto) {
    const apiKey = process.env.BREVO_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const fromName = process.env.CONTACT_FROM_NAME || "Auberge du Montcalm";

    if (!apiKey || !toEmail || !fromEmail) {
      throw new InternalServerErrorException(
        "Configuration email manquante.",
      );
    }

    const subject = `Nouvelle demande depuis le site - ${dto.name}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Nouvelle demande de contact</h2>

        <p><strong>Nom :</strong> ${escapeHtml(dto.name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(dto.email)}</p>

        <hr />

        <p><strong>Message :</strong></p>
        <p>${escapeHtml(dto.message).replace(/\n/g, "<br />")}</p>
      </div>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: toEmail,
            name: "Auberge du Montcalm",
          },
        ],
        replyTo: {
          email: dto.email,
          name: dto.name,
        },
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        "Impossible d’envoyer le message.",
      );
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}