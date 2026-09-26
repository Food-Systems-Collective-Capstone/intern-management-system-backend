import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface SubmitWeeklyProgressInput {
  reporting_week: string;
  accomplishments: string;
  blockers: string;
  next_steps: string;
}

export interface WeeklyProgressRecord {
  id: string;
  intern_id: string;
  reporting_week: string;
  accomplishments: string;
  blockers: string;
  next_steps: string;
  created_at: string;
  updated_at: string;
}

interface AccountRecord {
  id: string;
}

interface DatabaseError {
  code?: string;
}

@Injectable()
export class WeeklyProgressService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getWeeklyProgress(
    internId: string,
    reportingWeek?: string,
  ): Promise<WeeklyProgressRecord | WeeklyProgressRecord[] | null> {
    await this.ensureAccountExists(internId, 'Intern');

    if (reportingWeek) {
      this.validateReportingWeek(reportingWeek);

      const queryResult: unknown = await this.dataSource.query(
        `
          SELECT
            id,
            intern_id,
            reporting_week,
            accomplishments,
            blockers,
            next_steps,
            created_at,
            updated_at
          FROM weekly_progress
          WHERE intern_id = $1
            AND reporting_week = $2::date
          LIMIT 1
        `,
        [internId, reportingWeek],
      );

      const rows = queryResult as WeeklyProgressRecord[];

      return rows[0] ?? null;
    }

    const queryResult: unknown = await this.dataSource.query(
      `
        SELECT
          id,
          intern_id,
          reporting_week,
          accomplishments,
          blockers,
          next_steps,
          created_at,
          updated_at
        FROM weekly_progress
        WHERE intern_id = $1
        ORDER BY reporting_week DESC, created_at DESC
      `,
      [internId],
    );

    return queryResult as WeeklyProgressRecord[];
  }

  async getInternWeeklyProgressForMentor(
    mentorId: string,
    internId: string,
    reportingWeek?: string,
  ): Promise<WeeklyProgressRecord | WeeklyProgressRecord[] | null> {
    // The shared Mentor-to-Intern responsibility model is still unresolved.
    // For now, validate that both shared accounts exist and reuse the same
    // read-only Weekly Progress retrieval used by the Intern workflow.
    await this.ensureAccountExists(mentorId, 'Mentor');

    return this.getWeeklyProgress(internId, reportingWeek);
  }

  async submitWeeklyProgress(
    internId: string,
    input: SubmitWeeklyProgressInput,
  ): Promise<WeeklyProgressRecord> {
    await this.ensureAccountExists(internId, 'Intern');

    const reportingWeek = input.reporting_week?.trim();
    const accomplishments = input.accomplishments?.trim();
    const blockers = input.blockers?.trim();
    const nextSteps = input.next_steps?.trim();

    if (!reportingWeek || !accomplishments || !blockers || !nextSteps) {
      throw new BadRequestException(
        'Reporting week, accomplishments, blockers and next steps are required.',
      );
    }

    this.validateReportingWeek(reportingWeek);

    try {
      const queryResult: unknown = await this.dataSource.query(
        `
          INSERT INTO weekly_progress (
            intern_id,
            reporting_week,
            accomplishments,
            blockers,
            next_steps
          )
          VALUES ($1, $2::date, $3, $4, $5)
          RETURNING
            id,
            intern_id,
            reporting_week,
            accomplishments,
            blockers,
            next_steps,
            created_at,
            updated_at
        `,
        [internId, reportingWeek, accomplishments, blockers, nextSteps],
      );

      const rows = queryResult as WeeklyProgressRecord[];
      const createdProgress = rows[0];

      if (!createdProgress) {
        throw new Error('Weekly Progress could not be created.');
      }

      return createdProgress;
    } catch (error: unknown) {
      const databaseError = error as DatabaseError;

      if (databaseError.code === '23505') {
        throw new ConflictException(
          'Weekly Progress has already been submitted for this reporting week.',
        );
      }

      throw error;
    }
  }

  private async ensureAccountExists(
    accountId: string,
    accountLabel: string,
  ): Promise<void> {
    const queryResult: unknown = await this.dataSource.query(
      `
        SELECT id
        FROM shared_accounts
        WHERE id = $1
        LIMIT 1
      `,
      [accountId],
    );

    const rows = queryResult as AccountRecord[];

    if (!rows[0]) {
      throw new NotFoundException(`${accountLabel} account not found.`);
    }
  }

  private validateReportingWeek(reportingWeek: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportingWeek)) {
      throw new BadRequestException(
        'Reporting week must use YYYY-MM-DD format.',
      );
    }

    const parsedDate = new Date(`${reportingWeek}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== reportingWeek
    ) {
      throw new BadRequestException('Reporting week is not a valid date.');
    }
  }
}
