import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from './permissions';
import { PrismaService } from '../../prisma/prisma.service';

const SUPER_ADMIN_ONLY_PERMISSIONS = new Set<string>([
  Permissions.ADMIN_USERS_ROLE_UPDATE,
  Permissions.AUTHORIZATION_PERMISSIONS_MANAGE,
]);

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRolePermissions(role: UserRole) {
    const [permissions, assignedPermissions] = await Promise.all([
      this.prisma.permission.findMany({ orderBy: { key: 'asc' } }),
      this.prisma.rolePermission.findMany({
        where: { role },
        select: { permissionKey: true },
      }),
    ]);
    const assignedKeys = new Set(
      assignedPermissions.map(({ permissionKey }) => permissionKey),
    );

    return {
      role,
      permissions: permissions.map(({ key, description }) => ({
        key,
        description,
        assigned: assignedKeys.has(key),
      })),
    };
  }

  async replaceRolePermissions(
    role: UserRole,
    permissionKeys: string[],
    actorUserId: string,
  ) {
    if (role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'As permissões de SUPER_ADMIN só podem ser alteradas fora da API.',
      );
    }

    const keys = [...new Set(permissionKeys)].sort();
    if (keys.some((key) => SUPER_ADMIN_ONLY_PERMISSIONS.has(key))) {
      throw new ForbiddenException(
        'Uma ou mais permissões são reservadas a SUPER_ADMIN.',
      );
    }

    const knownPermissions = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { key: true },
    });

    if (knownPermissions.length !== keys.length) {
      throw new BadRequestException(
        'Uma ou mais permissões são desconhecidas.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.rolePermission.deleteMany({ where: { role } });

      if (keys.length > 0) {
        await transaction.rolePermission.createMany({
          data: keys.map((permissionKey) => ({ role, permissionKey })),
        });
      }

      await transaction.accessLog.create({
        data: {
          userId: actorUserId,
          action: `ROLE_PERMISSIONS_UPDATED:${role}:${keys.join(',')}`,
        },
      });
    });

    return this.getRolePermissions(role);
  }
}
