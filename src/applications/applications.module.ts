import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { SupabaseStorageBucketModule } from '../supabase-storage-bucket/supabase-storage-bucket.module';

@Module({
  imports: [SupabaseStorageBucketModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
