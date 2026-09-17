import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsString()
  @IsIn(['Low', 'Medium', 'High'])
  priority: string; 

  @IsUUID()
  @IsNotEmpty()
  assigned_intern_id: string;

  @IsUUID()
  @IsNotEmpty()
  assigned_by_mentor_id: string;
}
