import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MentorInternAssignment } from '../../mentor-assignments/entities/mentor-intern-assignment.entity';
import { AccountRole } from '../account-role.enum';

@Entity({ name: 'shared_accounts' })
export class SharedAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'auth_id', type: 'uuid', unique: true })
  authId: string;

  @Column({ type: 'text', default: AccountRole.Applicant })
  role: AccountRole;

  @Column({ name: 'created_at', type: 'date', default: () => 'CURRENT_DATE' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'date', default: () => 'CURRENT_DATE' })
  updatedAt: string;

  @OneToMany(() => MentorInternAssignment, (assignment) => assignment.mentor)
  mentoredInternAssignments: MentorInternAssignment[];

  @OneToOne(() => MentorInternAssignment, (assignment) => assignment.intern)
  mentorAssignment: MentorInternAssignment | null;

  @OneToMany(
    () => MentorInternAssignment,
    (assignment) => assignment.assignedBy,
  )
  assignmentsCreated: MentorInternAssignment[];
}
