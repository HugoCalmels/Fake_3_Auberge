import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/system-logs')
@UseGuards(JwtAuthGuard)
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  getLatest(@Query('limit') limit?: string) {
    return this.systemLogsService.getLatest(limit ? Number(limit) : 150);
  }
}
