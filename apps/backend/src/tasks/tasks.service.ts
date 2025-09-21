import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dtos/create-task.dto';
import { FilterTasksDto } from './dtos/filter-tasks.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.ensureProjectOwnership(dto.projectId, userId);
    const task = this.tasksRepository.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? 'backlog',
      priority: dto.priority ?? 0,
    });
    return this.tasksRepository.save(task);
  }

  async findAllForUser(
    userId: string,
    filters: FilterTasksDto,
  ): Promise<Task[]> {
    const query = this.tasksRepository
      .createQueryBuilder('task')
      .innerJoin(Project, 'project', 'project.id = task.projectId')
      .where('project.userId = :userId', { userId })
      .orderBy('task.createdAt', 'DESC');

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.projectId) {
      query.andWhere('task.projectId = :projectId', {
        projectId: filters.projectId,
      });
    }

    return query.getMany();
  }

  async findOneForUser(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .innerJoin(Project, 'project', 'project.id = task.projectId')
      .where('task.id = :taskId', { taskId })
      .andWhere('project.userId = :userId', { userId })
      .getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateForUser(
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOneForUser(taskId, userId);

    if (dto.projectId && dto.projectId !== task.projectId) {
      await this.ensureProjectOwnership(dto.projectId, userId);
      task.projectId = dto.projectId;
    }
    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description ?? null;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }

    return this.tasksRepository.save(task);
  }

  async removeForUser(taskId: string, userId: string): Promise<void> {
    const task = await this.findOneForUser(taskId, userId);
    await this.tasksRepository.remove(task);
  }

  private async ensureProjectOwnership(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
