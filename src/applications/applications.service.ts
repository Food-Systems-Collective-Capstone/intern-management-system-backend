import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
      ) {}

    async createApplication (dto: CreateApplicationDto){
        const testAccountId = 'cd8ac10e-1480-4237-97aa-71120bdcdbd4';
        let result = await this.dataSource.query (
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
                dto.motivation
            ]
        )

        return result;
    }
}
