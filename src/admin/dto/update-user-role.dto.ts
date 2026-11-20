import { UserRole } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn([UserRole.USER, UserRole.ADMIN])
  role: Exclude<UserRole, 'SUPER_ADMIN'>;
}
