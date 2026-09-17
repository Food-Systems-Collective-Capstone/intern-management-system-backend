import { Module } from '@nestjs/common';
import { SupabaseStorageBucketService } from './supabase-storage-bucket.service';

@Module({
  providers: [SupabaseStorageBucketService],
  exports: [SupabaseStorageBucketService]
})
export class SupabaseStorageBucketModule {}
