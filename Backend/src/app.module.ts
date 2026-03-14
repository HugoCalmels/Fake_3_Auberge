import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [RoomsModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
