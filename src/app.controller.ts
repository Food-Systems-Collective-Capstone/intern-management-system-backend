import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource
    ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async testDb(){
    const result = await this.dataSource.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'person_profile';");
    return { result }
  }
}
