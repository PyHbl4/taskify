import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../users/users.types';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterDto } from './dtos/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    return this.toAuthResponse(result);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    return this.toAuthResponse(result);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const result = await this.authService.refresh(dto);
    return this.toAuthResponse(result);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Logout successful' })
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(user.id, dto);
  }

  private toAuthResponse(result: AuthResult): AuthResponseDto {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromEntity(result.user),
    };
  }
}
