import { Module } from '@nestjs/common';
import { WeeklyProgressController } from './weekly-progress.controller';
import { WeeklyProgressService } from './weekly-progress.service';

@Module({
  controllers: [WeeklyProgressController],
  providers: [WeeklyProgressService],
})
export class WeeklyProgressModule {}