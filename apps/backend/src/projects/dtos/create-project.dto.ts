import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'paused', 'done'];

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: PROJECT_STATUSES, required: false })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;
}
