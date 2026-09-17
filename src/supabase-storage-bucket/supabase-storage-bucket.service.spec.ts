import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseStorageBucketService } from './supabase-storage-bucket.service';

describe('SupabaseStorageBucketService', () => {
  let service: SupabaseStorageBucketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseStorageBucketService],
    }).compile();

    service = module.get<SupabaseStorageBucketService>(SupabaseStorageBucketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
