import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { DataSource } from 'typeorm';
import { PersonProfile } from './interfaces/person-profile.interface';
import { GetApplicationQueryDto } from './dto/get-application-query.dto';

@Injectable()
export class ApplicationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createApplication(dto: CreateApplicationDto): Promise<PersonProfile> {
    const testAccountId = 'cd8ac10e-1480-4237-97aa-71120bdcdbd4';
    const result = await this.dataSource.query<PersonProfile>(
      'INSERT INTO person_profile (person_id, firstname, lastname, phone, email, university, degree, address, city, state, post_code, graduation_year, motivation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [
        testAccountId,
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
}
