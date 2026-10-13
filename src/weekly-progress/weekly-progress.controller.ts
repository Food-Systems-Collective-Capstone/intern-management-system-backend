import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TasksService } from '../tasks/tasks.service';
import { WeeklyProgressService } from './weekly-progress.service';
import { AccountRole } from '../accounts/account-role.enum';

interface SubmitWeeklyProgressBody {
  reporting_week: string;
  accomplishments: string;
  blockers: string;
  next_steps: string;
}

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
  };
};

@Controller('weekly-progress')
export class WeeklyProgressController {
  constructor(
    private readonly weeklyProgressService: WeeklyProgressService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('intern/:internId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  async getWeeklyProgress(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Query('reporting_week') reportingWeek?: string,
  ) {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    return this.weeklyProgressService.getWeeklyProgress(
      currentUser.id,
      reportingWeek,
    );
  }

  @Post('intern/:internId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Intern)
  async submitWeeklyProgress(
    @Req() req: AuthenticatedRequest,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Body() body: SubmitWeeklyProgressBody,
  ) {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    this.ensureOwnInternIdentity(currentUser.id, internId);

    return this.weeklyProgressService.submitWeeklyProgress(
      currentUser.id,
      body,
    );
  }

  @Get('mentor/:mentorId/intern/:internId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(AccountRole.Mentor)
  async getInternWeeklyProgressForMentor(
    @Req() req: AuthenticatedRequest,
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Query('reporting_week') reportingWeek?: string,
  ) {
    const currentUser = await this.tasksService.getCurrentUser(req.user.sub);

    if (mentorId !== currentUser.id) {
      throw new ForbiddenException(
        'Mentors can only access Weekly Progress as their own account.',
      );
    }

    return this.weeklyProgressService.getInternWeeklyProgressForMentor(
      currentUser.id,
      internId,
      reportingWeek,
    );
  }

  private ensureOwnInternIdentity(
    authenticatedInternId: string,
    requestedInternId: string,
  ): void {
    if (authenticatedInternId !== requestedInternId) {
      throw new ForbiddenException(
        'Interns can only access their own Weekly Progress.',
      );
    }
  }
}
