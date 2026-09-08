import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/health')
  async healthDb() {
    let write_test: string;
    const currentUpTime: string = await this.dataSource.query(
      'SELECT pg_postmaster_start_time()',
    ); //This get uptime of database by sending that query
    try {
      write_test = await this.dataSource.query(
        "INSERT INTO shared_accounts (email, role, auth_id) VALUES ('testconnection@example.com', 'Admin', '826880c1-db9f-4258-ac6d-486cd2a98a8c')",
      ); //This tests write permissions by inserting a record into table
    } catch {
      write_test = 'RECORD ALREADY ADDED NOTHING TO ADD';
    }

    const get_data: string = await this.dataSource.query(
      "SELECT *  FROM shared_accounts WHERE email = 'testconnection@example.com'",
    );

    let connectionStatus: boolean = true;

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      connectionStatus = false;
    }

    return { connectionStatus, currentUpTime, write_test, get_data };
  }
}
