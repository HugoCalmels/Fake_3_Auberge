import { Controller, Get, Query } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';

@Controller('admin/system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  getLatest(@Query('limit') limit?: string) {
    return this.systemLogsService.getLatest(
      limit ? Number(limit) : 150,
    );
  }
}