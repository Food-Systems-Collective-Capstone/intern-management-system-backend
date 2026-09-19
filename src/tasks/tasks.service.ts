import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';

type AssignmentPerson = {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  name: string;
};

@Injectable()
export class TasksService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getAssignmentPeople(): Promise<AssignmentPerson[]> {
    const people = await this.dataSource.query<
      {
        id: string;
        email: string;
        role: string;
        firstname: string | null;
        lastname: string | null;
      }[]
    >(
      `SELECT
         sa.id,
         sa.email,
         sa.role,
         pp.firstname,
         pp.lastname
       FROM shared_accounts sa
       LEFT JOIN person_profile pp
         ON pp.person_id = sa.id
       ORDER BY pp.firstname ASC NULLS LAST,
                pp.lastname ASC NULLS LAST,
                sa.email ASC`,
    );

    return people.map((person) => {
      const fullName = [person.firstname, person.lastname]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        id: person.id,
        email: person.email,
        role: person.role,
        first_name: person.firstname,
        last_name: person.lastname,
        name: fullName || person.email,
      };
    });
  }

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

  async getInternTasks(internId: string): Promise<Task[]> {
    const accounts = await this.dataSource.query<{ id: string }[]>(
      `SELECT id
       FROM shared_accounts
       WHERE id = $1`,
      [internId],
    );

    if (accounts.length === 0) {
      throw new BadRequestException('The Intern account does not exist.');
    }

    return this.dataSource.query<Task[]>(
      `SELECT *
       FROM tasks
       WHERE assigned_intern_id = $1
       ORDER BY due_date ASC NULLS LAST, created_at DESC`,
      [internId],
    );
  }

  async getInternTaskDetail(internId: string, taskId: string): Promise<Task> {
    const result = await this.dataSource.query<Task[]>(
      `SELECT *
       FROM tasks
       WHERE id = $1
         AND assigned_intern_id = $2`,
      [taskId, internId],
    );

    if (result.length === 0) {
      throw new NotFoundException(
        'Task not found or is not assigned to this Intern.',
      );
    }

    return result[0];
  }

  async startTask(internId: string, taskId: string): Promise<Task> {
    const existingTasks = await this.dataSource.query<Task[]>(
      `SELECT *
       FROM tasks
       WHERE id = $1
         AND assigned_intern_id = $2`,
      [taskId, internId],
    );

    if (existingTasks.length === 0) {
      throw new NotFoundException(
        'Task not found or is not assigned to this Intern.',
      );
    }

    const task = existingTasks[0];

    if (task.status !== 'Assigned') {
      throw new BadRequestException(
        'Only tasks with Assigned status can be moved to In Progress.',
      );
    }

    const updateResult = await this.dataSource.query<[Task[], number]>(
      `UPDATE tasks
       SET status = 'In Progress',
           updated_at = NOW()
       WHERE id = $1
         AND assigned_intern_id = $2
       RETURNING *`,
      [taskId, internId],
    );

    const [updatedTasks] = updateResult;

    return updatedTasks[0];
  }
}
