import {
  Controller,
  Get,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from './users.types';
import { UsersService } from './users.service';
import { UserResponseDto } from './dtos/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const entity = await this.usersService.findById(user.id);
    if (!entity) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromEntity(entity);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(UserResponseDto.fromEntity);
  }
}
