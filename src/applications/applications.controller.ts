import { Controller, Post, Body } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { PersonProfile } from './interfaces/person-profile.interface';


@Controller()
export class ApplicationsController {
    constructor (private readonly applicationService : ApplicationsService){}

    @Post('api/applications')
    async create(@Body() createApplicationDto: CreateApplicationDto) : Promise<PersonProfile>{
        return this.applicationService.createApplication(createApplicationDto);
    }
}
