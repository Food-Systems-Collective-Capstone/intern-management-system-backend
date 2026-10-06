import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { DataSource } from 'typeorm';
import { PersonProfile } from './interfaces/person-profile.interface';
import { GetApplicationQueryDto } from './dto/get-application-query.dto';

@Injectable()
export class ApplicationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createApplication(
    dto: CreateApplicationDto,
    authId: string,
  ): Promise<PersonProfile> {
    let account = await this.dataSource.query<{ id: string }[]>(
      'SELECT id FROM shared_accounts WHERE auth_id = $1',
      [authId],
    );

    if (account.length === 0) {
      account = await this.dataSource.query<{ id: string }[]>(
        'INSERT INTO shared_accounts (email, role, auth_id) VALUES ($1, $2, $3) RETURNING id',
        [dto.email, 'Applicant', authId],
      );
    }

    const personId = account[0].id;

    const result = await this.dataSource.query<PersonProfile>(
      'INSERT INTO person_profile (person_id, firstname, lastname, phone, email, university, degree, address, city, state, post_code, graduation_year, motivation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [
        personId,
        dto.firstname,
        dto.lastname,
        dto.phone,
        dto.email,
        dto.university,
        dto.degree,
        dto.address,
        dto.city,
        dto.state,
        dto.post_code,
        dto.graduation_year,
        dto.motivation,
      ],
    );

    return result;
  }

  async saveResumeURL(
    filePath: string,
    personId: string,
  ): Promise<PersonProfile> {
    const result = await this.dataSource.query<PersonProfile[]>(
      'UPDATE person_profile SET resume_url = $1 WHERE person_id = $2 RETURNING *',
      [filePath, personId],
    );

    if (result.length === 0) {
      throw new Error(`No person found with id ${personId}`);
    }

    return result[0];
  }

  async getApplications(
    query: GetApplicationQueryDto,
  ): Promise<{ data: PersonProfile[]; total: number }> {
    const { status, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const params: (string | number)[] = [];
    let whereClause: string = '';

    if (status) {
      params.push(status);
      whereClause = `WHERE application_status = $${params.length}`;
    }

    params.push(limit, offset);
    const limitParameter = `$${params.length - 1}`;
    const offsetParameter = `$${params.length}`;

    const data = await this.dataSource.query<PersonProfile[]>(
      `SELECT * FROM person_profile ${whereClause} ORDER BY created_at DESC LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
      params,
    );

    const countResult = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*) FROM person_profile ${whereClause}`,
      status ? [status] : [],
    );

    return { data, total: parseInt(countResult[0].count, 10) };
  }

  async updateStatus(
    person_id: string,
    status: string,
  ): Promise<PersonProfile> {
    const updateQuery = await this.dataSource.query<PersonProfile[]>(
      'UPDATE person_profile SET application_status = $1 WHERE person_id = $2 RETURNING *',
      [status, person_id],
    );

    if (updateQuery.length === 0) {
      throw new Error('No person found with this ID');
    }

    return updateQuery[0];
  }

  async promoteApplicant(
    personId: string,
    adminAuthId: string,
  ): Promise<PersonProfile> {
    const adminAccount = await this.dataSource.query<{ id: string }[]>(
      'SELECT id FROM shared_accounts WHERE auth_id = $1',
      [adminAuthId],
    );

    if (adminAccount.length === 0) {
      throw new NotFoundException('No admin account found for this user');
    }

    const adminId = adminAccount[0].id;

    const applicant = await this.dataSource.query<PersonProfile[]>(
      'SELECT * FROM person_profile WHERE person_id = $1',
      [personId],
    );

    if (applicant.length === 0) {
      throw new NotFoundException('No applicant with this ID found');
    }

    if (applicant[0].application_status !== 'Accepted') {
      throw new BadRequestException('Only accepted applicants can be promoted');
    }

    const account = await this.dataSource.query<{ id: string; role: string }[]>(
      'SELECT role from shared_accounts WHERE id = $1',
      [personId],
    );

    if (account.length === 0) {
      throw new BadRequestException('No matching account found with this ID');
    }

    if (account[0].role === 'Intern') {
      throw new BadRequestException('This applicant has already been promoted');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        "UPDATE shared_accounts SET role = 'Intern' WHERE id = $1",
        [personId],
      );

      await queryRunner.query(
        'UPDATE person_profile SET is_locked = true, promoted_at = now(), promoted_by = $1 WHERE person_id = $2',
        [adminId, personId],
      );

      await queryRunner.query(
        'INSERT INTO audit_logs (event, user_id, previous_state, new_state, changed_by) VALUES ($1, $2, $3, $4, $5)',
        [
          'PROFILE_STATE_CHANGE',
          personId,
          'APPLICANT_ACCEPTED',
          'INTERN_ACTIVE',
          adminId,
        ],
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const updated_applicant_profile = await this.dataSource.query<
      PersonProfile[]
    >('SELECT * FROM person_profile WHERE person_id = $1', [personId]);

    return updated_applicant_profile[0];
  }

  async getIntern(): Promise<(PersonProfile & { role: string })[]> {
    const interns = await this.dataSource.query<
      (PersonProfile & { role: string })[]
    >(
      "SELECT pp.*, sa.role FROM person_profile pp JOIN shared_accounts sa ON pp.person_id = sa.id WHERE sa.role = 'Intern'",
    );

    return interns;
  }

  async searchApplications(
    searchTerm: string,
  ): Promise<(PersonProfile & { role: string })[]> {
    const results = await this.dataSource.query<
      (PersonProfile & { role: string })[]
    >(
      `SELECT pp.*, sa.role 
      FROM person_profile pp
      JOIN shared_accounts sa ON pp.person_id = sa.id
      WHERE pp.firstname ILIKE $1
        OR pp.lastname ILIKE $1
        OR pp.email ILIKE $1
        OR pp.application_status ILIKE $1
        OR sa.role ILIKE $1
      ORDER BY pp.created_at DESC
      `,
      [`%${searchTerm}%`],
    );

    return results;
  }
}
