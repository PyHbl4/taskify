import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../users/users.types';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiCreatedResponse({ type: ProjectResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(user.id, dto);
    return ProjectResponseDto.fromEntity(project);
  }

  @Get()
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsService.findAllForUser(user.id);
    return projects.map(ProjectResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProjectResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOneForUser(id, user.id);
    return ProjectResponseDto.fromEntity(project);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProjectResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.updateForUser(id, user.id, dto);
    return ProjectResponseDto.fromEntity(project);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.projectsService.removeForUser(id, user.id);
  }
}
