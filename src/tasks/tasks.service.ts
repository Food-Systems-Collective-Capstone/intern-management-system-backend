import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  MentorSubmissionReview,
  MentorTaskCompletionResult,
  TaskSubmission,
  TaskSubmissionResult,
} from './interfaces/task-submission.interface';
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

  async getMentorSubmissionReviews(
    mentorId: string,
  ): Promise<MentorSubmissionReview[]> {
    const accounts = await this.dataSource.query<{ id: string }[]>(
      `SELECT id
       FROM shared_accounts
       WHERE id = $1`,
      [mentorId],
    );

    if (accounts.length === 0) {
      throw new BadRequestException('The Mentor account does not exist.');
    }

    const reviews = await this.dataSource.query<MentorSubmissionReview[]>(
      `SELECT
         t.id AS task_id,
         t.title,
         t.description AS task_description,
         t.due_date,
         t.priority,
         t.status,
         t.assigned_intern_id,
         t.assigned_by_mentor_id,
         COALESCE(
           NULLIF(
             TRIM(
               CONCAT_WS(
                 ' ',
                 pp.firstname,
                 pp.lastname
               )
             ),
             ''
           ),
           sa.email
         ) AS intern_name,
         sa.email AS intern_email,
         submission.id AS submission_id,
         submission.description AS submission_description,
         submission.file_url,
         submission.submitted_at
       FROM tasks t
       INNER JOIN shared_accounts sa
         ON sa.id = t.assigned_intern_id
       LEFT JOIN person_profile pp
         ON pp.person_id = t.assigned_intern_id
       LEFT JOIN LATERAL (
         SELECT
           ts.id,
           ts.description,
           ts.file_url,
           ts.submitted_at
         FROM task_submissions ts
         WHERE ts.task_id = t.id
           AND ts.submitted_by_intern_id = t.assigned_intern_id
         ORDER BY ts.submitted_at DESC NULLS LAST,
                  ts.created_at DESC
         LIMIT 1
       ) submission ON TRUE
       WHERE t.assigned_by_mentor_id = $1
       ORDER BY
         CASE t.status
           WHEN 'Submitted' THEN 0
           WHEN 'Completed' THEN 1
           ELSE 2
         END,
         submission.submitted_at DESC NULLS LAST,
         t.created_at DESC`,
      [mentorId],
    );

    return reviews.map((review) => ({
      ...review,
      file_name: review.file_url
        ? this.getSubmissionFileName(review.file_url)
        : null,
      attachment_url: null,
    }));
  }

  async completeTask(
    mentorId: string,
    taskId: string,
  ): Promise<MentorTaskCompletionResult> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tasks = (await queryRunner.query(
        `SELECT *
         FROM tasks
         WHERE id = $1
           AND assigned_by_mentor_id = $2
         FOR UPDATE`,
        [taskId, mentorId],
      )) as unknown as Task[];

      if (tasks.length === 0) {
        throw new NotFoundException(
          'Task not found or is not assigned by this Mentor.',
        );
      }

      const task = tasks[0];

      if (task.status !== 'Submitted') {
        throw new BadRequestException(
          'Only tasks with Submitted status can be marked Completed.',
        );
      }

      const submissions = (await queryRunner.query(
        `SELECT id
         FROM task_submissions
         WHERE task_id = $1
           AND submitted_by_intern_id = $2
         ORDER BY submitted_at DESC NULLS LAST,
                  created_at DESC
         LIMIT 1`,
        [taskId, task.assigned_intern_id],
      )) as unknown as { id: string }[];

      if (submissions.length === 0) {
        throw new BadRequestException(
          'This task does not have an Intern submission to review.',
        );
      }

      const updateResult = (await queryRunner.query(
        `UPDATE tasks
         SET status = 'Completed',
             updated_at = NOW()
         WHERE id = $1
           AND assigned_by_mentor_id = $2
           AND status = 'Submitted'
         RETURNING id, status, updated_at`,
        [taskId, mentorId],
      )) as unknown as [MentorTaskCompletionResult[], number];

      const [updatedTasks] = updateResult;

      if (updatedTasks.length === 0) {
        throw new BadRequestException(
          'The task could not be marked Completed.',
        );
      }

      await queryRunner.commitTransaction();

      return updatedTasks[0];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

  async validateTaskForSubmission(
    internId: string,
    taskId: string,
  ): Promise<void> {
    const tasks = await this.dataSource.query<Task[]>(
      `SELECT *
       FROM tasks
       WHERE id = $1
         AND assigned_intern_id = $2`,
      [taskId, internId],
    );

    if (tasks.length === 0) {
      throw new NotFoundException(
        'Task not found or is not assigned to this Intern.',
      );
    }

    if (tasks[0].status !== 'In Progress') {
      throw new BadRequestException(
        'Only tasks with In Progress status can be submitted.',
      );
    }

    const existingSubmissions = await this.dataSource.query<{ id: string }[]>(
      `SELECT id
       FROM task_submissions
       WHERE task_id = $1
         AND submitted_by_intern_id = $2
       LIMIT 1`,
      [taskId, internId],
    );

    if (existingSubmissions.length > 0) {
      throw new BadRequestException(
        'A submission already exists for this task.',
      );
    }
  }

  async submitTask(
    internId: string,
    taskId: string,
    description: string | null,
    fileUrl: string | null,
  ): Promise<TaskSubmissionResult> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tasks = (await queryRunner.query(
        `SELECT *
         FROM tasks
         WHERE id = $1
           AND assigned_intern_id = $2
         FOR UPDATE`,
        [taskId, internId],
      )) as unknown as Task[];

      if (tasks.length === 0) {
        throw new NotFoundException(
          'Task not found or is not assigned to this Intern.',
        );
      }

      if (tasks[0].status !== 'In Progress') {
        throw new BadRequestException(
          'Only tasks with In Progress status can be submitted.',
        );
      }

      const existingSubmissions = (await queryRunner.query(
        `SELECT id
         FROM task_submissions
         WHERE task_id = $1
           AND submitted_by_intern_id = $2
         LIMIT 1`,
        [taskId, internId],
      )) as unknown as { id: string }[];

      if (existingSubmissions.length > 0) {
        throw new BadRequestException(
          'A submission already exists for this task.',
        );
      }

      const submissionResult = (await queryRunner.query(
        `INSERT INTO task_submissions
          (
            task_id,
            submitted_by_intern_id,
            description,
            file_url,
            submitted_at,
            updated_at
          )
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [taskId, internId, description, fileUrl],
      )) as unknown as TaskSubmission[];

      const taskUpdateResult = (await queryRunner.query(
        `UPDATE tasks
         SET status = 'Submitted',
             updated_at = NOW()
         WHERE id = $1
           AND assigned_intern_id = $2
         RETURNING *`,
        [taskId, internId],
      )) as unknown as [Task[], number];

      const [updatedTasks] = taskUpdateResult;

      await queryRunner.commitTransaction();

      return {
        submission: submissionResult[0],
        task: {
          id: updatedTasks[0].id,
          status: updatedTasks[0].status,
          updated_at: updatedTasks[0].updated_at,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getSubmissionFileName(filePath: string): string {
    const storedName = filePath.split('/').pop() ?? filePath;

    return storedName.replace(/^\d+-/, '');
  }
}