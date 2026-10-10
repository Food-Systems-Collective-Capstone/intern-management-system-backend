import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedAccount } from '../accounts/entities/shared-account.entity';
import { MentorInternAssignment } from './entities/mentor-intern-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SharedAccount, MentorInternAssignment])],
  exports: [TypeOrmModule],
})
export class MentorAssignmentsModule {}
