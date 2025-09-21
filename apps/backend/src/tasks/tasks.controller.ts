import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { AuthenticatedUser } from '../users/users.types';
import { CreateTaskDto } from './dtos/create-task.dto';
import { FilterTasksDto } from './dtos/filter-tasks.dto';
import { TaskResponseDto } from './dtos/task-response.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiCreatedResponse({ type: TaskResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.create(user.id, dto);
    return TaskResponseDto.fromEntity(task);
  }

  @Get()
  @ApiOkResponse({ type: TaskResponseDto, isArray: true })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: FilterTasksDto,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksService.findAllForUser(user.id, filters);
    return tasks.map(TaskResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.findOneForUser(id, user.id);
    return TaskResponseDto.fromEntity(task);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.updateForUser(id, user.id, dto);
    return TaskResponseDto.fromEntity(task);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.tasksService.removeForUser(id, user.id);
  }
}
