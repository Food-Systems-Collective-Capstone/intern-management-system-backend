import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { SupabaseStorageBucketService } from '../supabase-storage-bucket/supabase-storage-bucket.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  const applicationsService = {
    createApplication: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: applicationsService,
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updates an applicant status through the service', async () => {
    const applicant = {
      person_id: 'a5cc35ee-6086-49d0-887e-a5680ca39a83',
      application_status: 'Accepted',
    };
    applicationsService.updateStatus.mockResolvedValue(applicant);

    await expect(
      controller.updateStatus(applicant.person_id, { status: 'Accepted' }),
    ).resolves.toBe(applicant);
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(
      applicant.person_id,
      'Accepted',
    );
  });
});
