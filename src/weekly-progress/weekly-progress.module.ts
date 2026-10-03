import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TasksService } from '../tasks/tasks.service';
import { WeeklyProgressController } from './weekly-progress.controller';
import { WeeklyProgressService } from './weekly-progress.service';

@Module({
  imports: [AuthModule],
  controllers: [WeeklyProgressController],
  providers: [WeeklyProgressService, TasksService],
})
export class WeeklyProgressModule {}
