import { Controller, Get } from "@nestjs/common";
import { StatsService } from "./stats.service";

@Controller("admin/stats")
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
  ) {}

  @Get()
  getDashboard() {
    return this.statsService.getDashboard();
  }
}