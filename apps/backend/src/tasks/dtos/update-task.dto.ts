import { PartialType } from '@nestjs/mapped-types';
import type { TaskStatus } from '../entities/task.entity';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  declare projectId?: string;
  declare title?: string;
  declare description?: string | null;
  declare status?: TaskStatus;
  declare priority?: number;
}
