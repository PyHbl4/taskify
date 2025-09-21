import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? 'active',
    });
    return this.projectsRepository.save(project);
  }

  findAllForUser(userId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneForUser(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async updateForUser(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOneForUser(projectId, userId);

    if (dto.name !== undefined) {
      project.name = dto.name;
    }
    if (dto.description !== undefined) {
      project.description = dto.description ?? null;
    }
    if (dto.status !== undefined) {
      project.status = dto.status;
    }

    return this.projectsRepository.save(project);
  }

  async removeForUser(projectId: string, userId: string): Promise<void> {
    const project = await this.findOneForUser(projectId, userId);
    await this.projectsRepository.remove(project);
  }
}
