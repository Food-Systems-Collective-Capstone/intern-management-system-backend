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

  it.each([undefined, 'Accepted'])(
    'restricts candidate rows and totals to applicants with status %s',
    async (status) => {
      query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: '0' }]);

      await expect(
        service.getApplications({ page: 2, limit: 6, status }),
      ).resolves.toEqual({ data: [], total: 0 });

      const filters = status ? ['applicant', status] : ['applicant'];
      const where = status
        ? 'WHERE sa.role = $1 AND pp.application_status = $2'
        : 'WHERE sa.role = $1';
      const from = 'FROM person_profile pp JOIN shared_accounts sa ON pp.person_id = sa.id';
      expect(query).toHaveBeenNthCalledWith(
        1,
        `SELECT pp.* ${from} ${where} ORDER BY pp.created_at DESC LIMIT $${filters.length + 1} OFFSET $${filters.length + 2}`,
        [...filters, 6, 6],
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        `SELECT COUNT(*) ${from} ${where}`,
        filters,
      );
    },
  );

  it('keeps every search alternative inside the applicant role filter', async () => {
    query.mockResolvedValue([]);

    await expect(service.searchApplications('admin')).resolves.toEqual([]);

    const [sql, parameters] = query.mock.calls[0] as [string, string[]];
    expect(sql.replace(/\s+/g, ' ')).toContain(
      'WHERE sa.role = $2 AND (pp.firstname ILIKE $1 OR pp.lastname ILIKE $1 OR pp.email ILIKE $1 OR pp.application_status ILIKE $1 OR sa.role ILIKE $1)',
    );
    expect(parameters).toEqual(['%admin%', 'applicant']);
  });

  it.each(['Accepted', 'Rejected'])(
    'persists an applicant status change to %s and returns the updated row',
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
