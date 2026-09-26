import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseStorageBucketService } from '../supabase-storage-bucket/supabase-storage-bucket.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  MentorSubmissionReview,
  MentorTaskCompletionResult,
  TaskSubmissionResult,
} from './interfaces/task-submission.interface';
import { Task } from './interfaces/task.interface';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly supabaseStorageService: SupabaseStorageBucketService,
  ) {}

  @Post()
  createTask(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.createTask(dto);
  }

  @Get('assignment-people')
  getAssignmentPeople() {
    return this.tasksService.getAssignmentPeople();
  }

  @Get('mentor/:mentorId/reviews')
  async getMentorSubmissionReviews(
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
  ): Promise<MentorSubmissionReview[]> {
    const reviews =
      await this.tasksService.getMentorSubmissionReviews(mentorId);

    return Promise.all(
      reviews.map(async (review) => {
        if (!review.file_url) {
          return review;
        }

        const attachmentUrl =
          await this.supabaseStorageService.createTaskSubmissionSignedUrl(
            review.file_url,
          );

        return {
          ...review,
          attachment_url: attachmentUrl,
        };
      }),
    );
  }

  @Patch('mentor/:mentorId/:taskId/complete')
  completeTask(
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<MentorTaskCompletionResult> {
    return this.tasksService.completeTask(mentorId, taskId);
  }

  @Get('intern/:internId')
  getInternTasks(
    @Param('internId', new ParseUUIDPipe()) internId: string,
  ): Promise<Task[]> {
    return this.tasksService.getInternTasks(internId);
  }

  @Get('intern/:internId/:taskId')
  getInternTaskDetail(
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<Task> {
    return this.tasksService.getInternTaskDetail(internId, taskId);
  }

  @Patch('intern/:internId/:taskId/start')
  startTask(
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<Task> {
    return this.tasksService.startTask(internId, taskId);
  }

  @Post('intern/:internId/:taskId/submission')
  @UseInterceptors(FileInterceptor('file'))
  async submitTask(
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body('description') description: string | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TaskSubmissionResult> {
    const cleanDescription = description?.trim() ?? '';

    if (!cleanDescription && !file) {
      throw new BadRequestException(
        'Please provide a submission description or attach a file.',
      );
    }

    await this.tasksService.validateTaskForSubmission(internId, taskId);

    let fileUrl: string | null = null;

    if (file) {
      fileUrl = await this.supabaseStorageService.uploadTaskSubmission(
        file,
        taskId,
        internId,
      );
    }

    return this.tasksService.submitTask(
      internId,
      taskId,
      cleanDescription || null,
      fileUrl,
    );
  }
}