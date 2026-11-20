import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '../authorization/permissions';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

class ProtectedController {}

RequirePermissions(
  Permissions.ADMIN_USERS_READ,
  Permissions.ADMIN_STATS_READ,
)(ProtectedController);

function createContext(
  grantedPermissions: string[] | undefined,
  controller = ProtectedController,
): ExecutionContext {
  const handler = () => undefined;

  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions: grantedPermissions } }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows a user with all required permissions', () => {
    expect(
      guard.canActivate(
        createContext([
          Permissions.ADMIN_USERS_READ,
          Permissions.ADMIN_STATS_READ,
        ]),
      ),
    ).toBe(true);
  });

  it('denies a user missing any required permission', () => {
    expect(
      guard.canActivate(createContext([Permissions.ADMIN_USERS_READ])),
    ).toBe(false);
  });

  it('denies a route without permission metadata', () => {
    expect(
      guard.canActivate(createContext([], class UnconfiguredController {})),
    ).toBe(false);
  });
});
