export const Permissions = {
  ADMIN_USERS_READ: 'admin.users.read',
  ADMIN_USERS_STATUS_UPDATE: 'admin.users.status.update',
  ADMIN_USERS_ROLE_UPDATE: 'admin.users.role.update',
  ADMIN_SUBSCRIPTIONS_READ: 'admin.subscriptions.read',
  ADMIN_PAYMENTS_READ: 'admin.payments.read',
  ADMIN_STATS_READ: 'admin.stats.read',
  AUTHORIZATION_PERMISSIONS_READ: 'authorization.permissions.read',
  AUTHORIZATION_PERMISSIONS_MANAGE: 'authorization.permissions.manage',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];
