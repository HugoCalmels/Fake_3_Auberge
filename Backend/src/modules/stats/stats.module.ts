import { PrismaModule } from "src/prisma/prisma.module";
import { StatsController } from "./stats.controller";
import { Module } from "@nestjs/common";
import { StatsService } from "./stats.service";

@Module({
  imports: [PrismaModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}