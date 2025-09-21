import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done'];

export class CreateTaskDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @ApiProperty({ minimum: 0, maximum: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;
}
