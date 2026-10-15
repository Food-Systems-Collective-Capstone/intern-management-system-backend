import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { DataSource } from 'typeorm';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: DataSource,
          useValue: { query },
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each(['Accepted', 'Rejected'])(
    'updates an applicant status change to %s and returns the updated row',
    async (status) => {
      const applicant = {
        person_id: 'a5cc35ee-6086-49d0-887e-a5680ca39a83',
        application_status: status,
      };
      query.mockResolvedValue([applicant]);

      await expect(
        service.updateStatus(applicant.person_id, status),
      ).resolves.toEqual(applicant);
      expect(query).toHaveBeenCalledWith(
        'UPDATE person_profile SET application_status = $1 WHERE person_id = $2 RETURNING *',
        [status, applicant.person_id],
      );
    },
  );

  it('reports a missing applicant without claiming the update succeeded', async () => {
    query.mockResolvedValue([]);

    await expect(
      service.updateStatus(
        'a5cc35ee-6086-49d0-887e-a5680ca39a83',
        'Accepted',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
