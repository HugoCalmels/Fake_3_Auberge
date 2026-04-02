import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CreateAdminRoomDto } from "./dto/create-admin-room.dto";
import { UpdateAdminRoomStatusDto } from "./dto/update-admin-room-status.dto";
import { CreateAdminRoomTypeDto } from "./dto/create-admin-room-type.dto";
import { CreateAdminBookingDto } from "./dto/create-admin-booking.dto";
import { UpdateAdminBookingDto } from "./dto/update-admin-booking.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("rooms")
  async getRooms() {
    return this.adminService.getRooms();
  }

  @Post("rooms")
  async createRoom(@Body() dto: CreateAdminRoomDto) {
    return this.adminService.createRoom(dto);
  }

  @Patch("rooms/:id/status")
  async updateRoomStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAdminRoomStatusDto
  ) {
    return this.adminService.updateRoomStatus(id, dto);
  }

  @Delete("rooms/:id")
  async deleteRoom(@Param("id") id: string) {
    return this.adminService.deleteRoom(id);
  }

  @Get("room-types")
  async getRoomTypes() {
    return this.adminService.getRoomTypes();
  }

  @Post("room-types")
  async createRoomType(@Body() dto: CreateAdminRoomTypeDto) {
    return this.adminService.createRoomType(dto);
  }

  @Get("bookings")
  async getBookings() {
    return this.adminService.getBookings();
  }

  @Get("bookings/:id")
  async getBookingById(@Param("id") id: string) {
    return this.adminService.getBookingById(id);
  }

  @Post("bookings")
  async createBooking(@Body() dto: CreateAdminBookingDto) {
    return this.adminService.createBooking(dto);
  }

  @Patch("bookings/:id")
  async updateBooking(
    @Param("id") id: string,
    @Body() dto: UpdateAdminBookingDto
  ) {
    return this.adminService.updateBooking(id, dto);
  }

  @Patch("bookings/:id/cancel")
  async cancelBooking(@Param("id") id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Patch("bookings/:id/assign-room")
  async assignRoom(
    @Param("id") id: string,
    @Body("roomId") roomId: string
  ) {
    return this.adminService.assignRoom(id, roomId);
  }

  @Get("planning")
  async getPlanning(@Query("from") from: string, @Query("to") to: string) {
    return this.adminService.getPlanning(from, to);
  }
}