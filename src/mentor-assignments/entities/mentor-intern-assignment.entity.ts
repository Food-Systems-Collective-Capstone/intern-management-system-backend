import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SharedAccount } from '../../accounts/entities/shared-account.entity';

@Entity({ name: 'mentor_intern_assignments' })
@Check(
  'CHK_mentor_intern_assignments_distinct_accounts',
  '"mentor_id" <> "intern_id"',
)
@Index('UQ_mentor_intern_assignments_intern_id', ['internId'], {
  unique: true,
})
@Index('IDX_mentor_intern_assignments_mentor_id', ['mentorId'])
export class MentorInternAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId: string;

  @ManyToOne(
    () => SharedAccount,
    (account) => account.mentoredInternAssignments,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'mentor_id' })
  mentor: SharedAccount;

  @Column({ name: 'intern_id', type: 'uuid' })
  internId: string;

  @OneToOne(() => SharedAccount, (account) => account.mentorAssignment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'intern_id' })
  intern: SharedAccount;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedById: string | null;

  @ManyToOne(() => SharedAccount, (account) => account.assignmentsCreated, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_by' })
  assignedBy: SharedAccount | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
