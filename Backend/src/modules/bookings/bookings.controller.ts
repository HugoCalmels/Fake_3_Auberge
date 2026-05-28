import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingAvailabilityDto } from './dto/get-booking-availability.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  async getAvailability(@Query() dto: GetBookingAvailabilityDto) {
    return this.bookingsService.getAvailability(dto);
  }

  @Post()
  async create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }
  @Get('room-types')
async getRoomTypes() {
  return this.bookingsService.getPublicRoomTypes();
}
}
