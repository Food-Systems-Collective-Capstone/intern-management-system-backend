import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseStorageBucketService } from '../supabase-storage-bucket/supabase-storage-bucket.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  MentorSubmissionReview,
  MentorTaskCompletionResult,
  TaskSubmissionResult,
} from './interfaces/task-submission.interface';
import { Task } from './interfaces/task.interface';
import { TasksService } from './tasks.service';
import { AccountRole } from '../accounts/account-role.enum';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
  };
};

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly supabaseStorageService: SupabaseStorageBucketService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Mentor)
  @UseInterceptors(FileInterceptor('reference_file'))
  async createTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTaskDto,
    @UploadedFile() referenceFile?: Express.Multer.File,
  ): Promise<Task> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    if (dto.assigned_by_mentor_id !== currentUser.id) {
      throw new ForbiddenException(
        'Mentors can only assign tasks as their own account.',
      );
    }

    await this.tasksService.validateTaskAssignmentAccounts(dto);

    let referenceFileUrl: string | null = null;
    let referenceFileName: string | null = null;

    if (referenceFile) {
      referenceFileUrl = await this.supabaseStorageService.uploadTaskReference(
        referenceFile,
        currentUser.id,
      );

      referenceFileName = referenceFile.originalname;
    }

    return this.tasksService.createTask(
      dto,
      referenceFileUrl,
      referenceFileName,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.tasksService.getCurrentUser(req.user.sub);
  }

  @Get('assignment-people')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Mentor)
  getAssignmentPeople() {
    return this.tasksService.getAssignmentPeople();
  }

  @Get('mentor/:mentorId/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Mentor)
  async getMentorSubmissionReviews(
    @Req() req: AuthenticatedRequest,
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
  ): Promise<MentorSubmissionReview[]> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    if (mentorId !== currentUser.id) {
      throw new ForbiddenException(
        'Mentors can only access their own task reviews.',
      );
    }

    const reviews = await this.tasksService.getMentorSubmissionReviews(
      currentUser.id,
    );

    return Promise.all(
      reviews.map(async (review) => {
        if (!review.file_url) {
          return review;
        }

        try {
          const attachmentUrl =
            await this.supabaseStorageService.createTaskSubmissionSignedUrl(
              review.file_url,
            );

          return {
            ...review,
            attachment_url: attachmentUrl,
          };
        } catch {
          return {
            ...review,
            attachment_url: null,
          };
        }
      }),
    );
  }

  @Patch('mentor/:mentorId/:taskId/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Mentor)
  async completeTask(
    @Req() req: AuthenticatedRequest,
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<MentorTaskCompletionResult> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    if (mentorId !== currentUser.id) {
      throw new ForbiddenException(
        'Mentors can only complete tasks assigned by their own account.',
      );
    }

    return this.tasksService.completeTask(currentUser.id, taskId);
  }

  @Get('intern/:internId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  async getInternTasks(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
  ): Promise<Task[]> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    return this.tasksService.getInternTasks(currentUser.id);
  }

  @Get('intern/:internId/:taskId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  async getInternTaskDetail(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<Task> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    const task = await this.tasksService.getInternTaskDetail(
      currentUser.id,
      taskId,
    );

    if (!task.reference_file_url) {
      return {
        ...task,
        reference_attachment_url: null,
      };
    }

    try {
      const referenceAttachmentUrl =
        await this.supabaseStorageService.createTaskReferenceSignedUrl(
          task.reference_file_url,
        );

      return {
        ...task,
        reference_attachment_url: referenceAttachmentUrl,
      };
    } catch {
      return {
        ...task,
        reference_attachment_url: null,
      };
    }
  }

  @Patch('intern/:internId/:taskId/start')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  async startTask(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ): Promise<Task> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    return this.tasksService.startTask(currentUser.id, taskId);
  }

  @Post('intern/:internId/:taskId/submission')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  @UseInterceptors(FileInterceptor('file'))
  async submitTask(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body('description') description: string | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TaskSubmissionResult> {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    const cleanDescription = description?.trim() ?? '';

    if (!cleanDescription) {
      throw new BadRequestException('Submission description is required.');
    }

    await this.tasksService.validateTaskForSubmission(currentUser.id, taskId);

    let fileUrl: string | null = null;

    if (file) {
      fileUrl = await this.supabaseStorageService.uploadTaskSubmission(
        file,
        taskId,
        currentUser.id,
      );
    }

    return this.tasksService.submitTask(
      currentUser.id,
      taskId,
      cleanDescription,
      fileUrl,
    );
  }

  private ensureOwnInternIdentity(
    authenticatedInternId: string,
    requestedInternId: string,
  ): void {
    if (authenticatedInternId !== requestedInternId) {
      throw new ForbiddenException(
        'Interns can only access their own Team B data.',
      );
    }
  }
}
