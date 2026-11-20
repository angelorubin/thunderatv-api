import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Permissions } from './permissions';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const prisma = {
    permission: { findMany: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const service = new PermissionsService(prisma);

  it('does not allow changing SUPER_ADMIN permissions through the API', async () => {
    await expect(
      service.replaceRolePermissions(UserRole.SUPER_ADMIN, [], 'actor-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow delegating protected permissions to other roles', async () => {
    for (const permission of [
      Permissions.AUTHORIZATION_PERMISSIONS_MANAGE,
      Permissions.ADMIN_USERS_ROLE_UPDATE,
    ]) {
      await expect(
        service.replaceRolePermissions(
          UserRole.ADMIN,
          [permission],
          'actor-id',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
  });
});
