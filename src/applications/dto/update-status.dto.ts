import {IsIn, IsNotEmpty} from 'class-validator';

const VALID_STATUSES = [
    'Applied',
    'Review',
    'Shortlisted',
    'Interviewing',
    'Hired',
    'Rejected',
    'Withdrawn'
]

export class UpdateStatusDto{
    @IsNotEmpty()
    @IsIn(VALID_STATUSES)
    status: string;
}