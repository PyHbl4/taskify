import { ApiProperty } from '@nestjs/swagger';
import type { Project, ProjectStatus } from '../entities/project.entity';

export class ProjectResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['active', 'paused', 'done'] })
  status!: ProjectStatus;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    } satisfies ProjectResponseDto;
  }
}
