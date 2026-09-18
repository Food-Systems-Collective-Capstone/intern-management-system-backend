import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseStorageBucketService } from './supabase-storage-bucket.service';

//Test code from line 5 to 11 is AI generated 
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
    }
  }))
}))

describe('SupabaseStorageBucketService', () => {
  let service: SupabaseStorageBucketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseStorageBucketService],
    }).compile();

    service = module.get<SupabaseStorageBucketService>(
      SupabaseStorageBucketService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
