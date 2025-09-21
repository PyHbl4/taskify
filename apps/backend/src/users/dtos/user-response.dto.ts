import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/decorators/roles.decorator';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [String], enum: ['user', 'admin'] })
  roles!: Role[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } satisfies UserResponseDto;
  }
}
