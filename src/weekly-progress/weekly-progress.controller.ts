import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { WeeklyProgressService } from './weekly-progress.service';

interface SubmitWeeklyProgressBody {
  reporting_week: string;
  accomplishments: string;
  blockers: string;
  next_steps: string;
}

@Controller('weekly-progress')
export class WeeklyProgressController {
  constructor(private readonly weeklyProgressService: WeeklyProgressService) {}

  @Get('intern/:internId')
  getWeeklyProgress(
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Query('reporting_week') reportingWeek?: string,
  ) {
    return this.weeklyProgressService.getWeeklyProgress(
      internId,
      reportingWeek,
    );
  }

  @Post('intern/:internId')
  submitWeeklyProgress(
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Body() body: SubmitWeeklyProgressBody,
  ) {
    return this.weeklyProgressService.submitWeeklyProgress(internId, body);
  }

  @Get('mentor/:mentorId/intern/:internId')
  getInternWeeklyProgressForMentor(
    @Param('mentorId', new ParseUUIDPipe()) mentorId: string,
    @Param('internId', new ParseUUIDPipe()) internId: string,
    @Query('reporting_week') reportingWeek?: string,
  ) {
    return this.weeklyProgressService.getInternWeeklyProgressForMentor(
      mentorId,
      internId,
      reportingWeek,
    );
  }
}