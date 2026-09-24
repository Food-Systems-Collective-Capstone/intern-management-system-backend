import { Module } from '@nestjs/common';
import { SupabaseStorageBucketModule } from '../supabase-storage-bucket/supabase-storage-bucket.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [SupabaseStorageBucketModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}