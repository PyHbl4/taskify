import { ApiProperty } from '@nestjs/swagger';
import type { Task, TaskStatus } from '../entities/task.entity';

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['backlog', 'todo', 'in_progress', 'done'] })
  status!: TaskStatus;

  @ApiProperty({ minimum: 0, maximum: 3 })
  priority!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(task: Task): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    } satisfies TaskResponseDto;
  }
}
