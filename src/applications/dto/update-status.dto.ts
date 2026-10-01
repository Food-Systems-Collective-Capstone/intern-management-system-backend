import { IsIn, IsNotEmpty } from 'class-validator';

const VALID_STATUSES = [
  'Applied',
  'Review',
  'Shortlisted',
  'Interviewing',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsIn(VALID_STATUSES)
  status: string;
}
