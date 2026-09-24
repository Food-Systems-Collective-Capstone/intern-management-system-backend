import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { SupabaseStorageBucketService } from '../supabase-storage-bucket/supabase-storage-bucket.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: { createApplication: jest.fn() },
        },
        {
          provide: SupabaseStorageBucketService,
          useValue: { uploadResume: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
