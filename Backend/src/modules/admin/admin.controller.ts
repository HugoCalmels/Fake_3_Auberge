import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminService } from './admin.service';
import { CreateAdminRoomDto } from './dto/create-admin-room.dto';
import { UpdateAdminRoomStatusDto } from './dto/update-admin-room-status.dto';
import { CreateAdminRoomTypeDto } from './dto/create-admin-room-type.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateAdminRoomTypeDto } from './dto/update-admin-room-type.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('rooms')
  async getRooms() {
    return this.adminService.getRooms();
  }

  @Post('rooms')
  async createRoom(@Body() dto: CreateAdminRoomDto) {
    return this.adminService.createRoom(dto);
  }

  @Patch('rooms/:id/status')
  async updateRoomStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoomStatusDto,
  ) {
    return this.adminService.updateRoomStatus(id, dto);
  }

  @Delete('rooms/:id')
  async deleteRoom(@Param('id') id: string) {
    return this.adminService.deleteRoom(id);
  }

  @Get('room-types')
  async getRoomTypes() {
    return this.adminService.getRoomTypes();
  }

  @Post('room-types')
  async createRoomType(@Body() dto: CreateAdminRoomTypeDto) {
    return this.adminService.createRoomType(dto);
  }

  @Patch('room-types/:id')
async updateRoomType(
  @Param('id') id: string,
  @Body() dto: UpdateAdminRoomTypeDto,
) {
  return this.adminService.updateRoomType(id, dto);
}

@Delete('room-types/:id')
async deleteRoomType(@Param('id') id: string) {
  return this.adminService.deleteRoomType(id);
}

@Post('room-types/upload-image')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './public/rooms',
      filename: (_req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = extname(file.originalname).toLowerCase();

        callback(null, `room-${uniqueSuffix}${extension}`);
      },
    }),
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        callback(new Error('Format image invalide.'), false);
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: 3 * 1024 * 1024,
    },
  }),
)
async uploadRoomTypeImage(@UploadedFile() file: Express.Multer.File) {
  return {
    imageUrl: `/rooms/${file.filename}`,
  };
}

  @Get('bookings')
  async getBookings() {
    return this.adminService.getBookings();
  }

  @Get('bookings/:id')
  async getBookingById(@Param('id') id: string) {
    return this.adminService.getBookingById(id);
  }

  @Post('bookings')
  async createBooking(@Body() dto: CreateAdminBookingDto) {
    return this.adminService.createBooking(dto);
  }

  @Patch('bookings/:id')
  async updateBooking(
    @Param('id') id: string,
    @Body() dto: UpdateAdminBookingDto,
  ) {
    return this.adminService.updateBooking(id, dto);
  }

  @Patch('bookings/:id/cancel')
  async cancelBooking(@Param('id') id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Patch('bookings/:id/assign-room')
  async assignRoom(@Param('id') id: string, @Body('roomId') roomId: string) {
    return this.adminService.assignRoom(id, roomId);
  }

  @Get('planning')
  async getPlanning(@Query('from') from: string, @Query('to') to: string) {
    return this.adminService.getPlanning(from, to);
  }

  
}