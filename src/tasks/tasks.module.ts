import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseStorageBucketModule } from '../supabase-storage-bucket/supabase-storage-bucket.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [SupabaseStorageBucketModule, AuthModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
