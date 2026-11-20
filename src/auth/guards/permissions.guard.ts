import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '../authorization/permissions';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionKey[]
    >(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
      return false;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { permissions?: string[] };
    }>();
    const grantedPermissions = request.user?.permissions;

    return (
      grantedPermissions !== undefined &&
      requiredPermissions.every((permission) =>
        grantedPermissions.includes(permission),
      )
    );
  }
}
