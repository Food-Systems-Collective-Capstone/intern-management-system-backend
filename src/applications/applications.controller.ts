import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
  Param,
  Query,
  Get,
  Patch,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { PersonProfile } from './interfaces/person-profile.interface';
import { SupabaseStorageBucketService } from '../supabase-storage-bucket/supabase-storage-bucket.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetApplicationQueryDto } from './dto/get-application-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class ApplicationsController {
  constructor(
    private readonly applicationService: ApplicationsService,
    private readonly supabaseStorageService: SupabaseStorageBucketService,
  ) {}

  @Post('api/applications')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: Request & {user : {sub : string}},
  ): Promise<PersonProfile> {
    const personId = req.user.sub;
    return this.applicationService.createApplication(createApplicationDto, personId);
  }

  @Post('api/applications/resume/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @Param('id', ParseUUIDPipe) personId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype != 'application/pdf') {
      throw new BadRequestException('File must be pdf');
    }

    const filePath = await this.supabaseStorageService.uploadResume(
      file,
      personId,
    );
    return this.applicationService.saveResumeURL(filePath, personId);
  }

  @Get('api/applications')
  async getAll(@Query() query: GetApplicationQueryDto) {
    return this.applicationService.getApplications(query);
  }

  @Patch('api/applications/:id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) personId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<PersonProfile> {
    return this.applicationService.updateStatus(
      personId,
      updateStatusDto.status,
    );
  }
}
