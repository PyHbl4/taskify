import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, verify } from 'argon2';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { TokensConfig } from '../config/tokens.config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtPayload, RefreshPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.createUser({ email, passwordHash });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { tokenId: payload.tokenId, userId: payload.sub },
    });

    if (!tokenEntity || tokenEntity.revokedAt) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    const matches = await verify(tokenEntity.tokenHash, dto.refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    if (tokenEntity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenEntity);

    return this.issueTokens(user);
  }

  async logout(userId: string, dto: RefreshTokenDto): Promise<void> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    if (payload.sub !== userId) {
      throw new UnauthorizedException('Refresh token does not belong to user');
    }

    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { tokenId: payload.tokenId, userId },
    });

    if (!tokenEntity) {
      return;
    }

    const matches = await verify(tokenEntity.tokenHash, dto.refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Refresh token is not valid');
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenEntity);
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const tokensConfig = this.configService.getOrThrow<TokensConfig>('tokens');
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: tokensConfig.accessSecret,
      expiresIn: tokensConfig.accessExpiresIn,
    });

    const tokenId = randomUUID();
    const refreshPayload: RefreshPayload = { ...payload, tokenId };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: tokensConfig.refreshSecret,
      expiresIn: tokensConfig.refreshExpiresIn,
    });

    await this.persistRefreshToken(user.id, refreshToken, tokenId);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    tokenId: string,
  ): Promise<void> {
    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    if (!decoded?.exp) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = await hash(refreshToken);
    const entity = this.refreshTokenRepository.create({
      tokenId,
      userId,
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000),
      revokedAt: null,
    });
    await this.refreshTokenRepository.save(entity);
  }

  private async hashPassword(password: string): Promise<string> {
    const pepper = this.configService.getOrThrow<TokensConfig>('tokens')
      .argon2Pepper;
    return hash(password + pepper);
  }

  private async verifyPassword(
    password: string,
    hashValue: string,
  ): Promise<boolean> {
    const pepper = this.configService.getOrThrow<TokensConfig>('tokens')
      .argon2Pepper;
    return verify(hashValue, password + pepper);
  }

  private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
    const tokensConfig = this.configService.getOrThrow<TokensConfig>('tokens');
    try {
      return await this.jwtService.verifyAsync<RefreshPayload>(token, {
        secret: tokensConfig.refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Refresh token is not valid');
    }
  }
}
