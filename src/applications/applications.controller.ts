import { Controller, Post, Body } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';


@Controller()
export class ApplicationsController {
    constructor (private readonly applicationService : ApplicationsService){}

    @Post('api/applications')
    async create(@Body() createApplicationDto: CreateApplicationDto){
        return this.applicationService.createApplication(createApplicationDto);
    }
}
