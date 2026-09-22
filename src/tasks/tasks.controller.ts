import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  createTask(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.createTask(dto);
  }

  @Get('assignment-people')
  getAssignmentPeople() {
    return this.tasksService.getAssignmentPeople();
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
}
