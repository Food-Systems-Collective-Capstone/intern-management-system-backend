import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';

@Injectable()
export class TasksService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const accounts = await this.dataSource.query<{ id: string }[]>(
      `SELECT id
       FROM shared_accounts
       WHERE id = ANY($1::uuid[])`,
      [[dto.assigned_intern_id, dto.assigned_by_mentor_id]],
    );

    const accountIds = new Set(accounts.map((account) => account.id));

    if (!accountIds.has(dto.assigned_intern_id)) {
      throw new BadRequestException(
        'The selected Intern account does not exist.',
      );
    }

    if (!accountIds.has(dto.assigned_by_mentor_id)) {
      throw new BadRequestException(
        'The selected Mentor account does not exist.',
      );
    }

    const result = await this.dataSource.query<Task[]>(
      `INSERT INTO tasks
        (
          title,
          description,
          due_date,
          status,
          priority,
          assigned_intern_id,
          assigned_by_mentor_id
        )
       VALUES ($1, $2, $3, 'Assigned', $4, $5, $6)
       RETURNING *`,
      [
        dto.title,
        dto.description ?? null,
        dto.due_date ?? null,
        dto.priority,
        dto.assigned_intern_id,
        dto.assigned_by_mentor_id,
      ],
    );

    return result[0];
  }
}
