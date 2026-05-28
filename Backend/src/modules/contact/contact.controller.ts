import { Body, Controller, Post } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendContactMessage(@Body() dto: CreateContactMessageDto) {
    await this.contactService.sendContactMessage(dto);

    return {
      success: true,
      message: "Message envoyé avec succès.",
    };
  }
}