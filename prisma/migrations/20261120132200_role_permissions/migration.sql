CREATE TABLE "Permission" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "RolePermission" (
    "role" "UserRole" NOT NULL,
    "permissionKey" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role", "permissionKey")
);

CREATE INDEX "RolePermission_permissionKey_idx" ON "RolePermission"("permissionKey");

ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_permissionKey_fkey"
FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Permission" ("key", "description") VALUES
    ('admin.users.read', 'List user accounts'),
    ('admin.users.status.update', 'Change user account status'),
    ('admin.users.role.update', 'Assign USER or ADMIN to a user account'),
    ('admin.subscriptions.read', 'List subscriptions'),
    ('admin.payments.read', 'List payments'),
    ('admin.stats.read', 'View administration statistics'),
    ('authorization.permissions.read', 'View role permission assignments'),
    ('authorization.permissions.manage', 'Change USER and ADMIN permissions');

INSERT INTO "RolePermission" ("role", "permissionKey") VALUES
    ('ADMIN', 'admin.users.read'),
    ('ADMIN', 'admin.users.status.update'),
    ('ADMIN', 'admin.subscriptions.read'),
    ('ADMIN', 'admin.payments.read'),
    ('ADMIN', 'admin.stats.read'),
    ('SUPER_ADMIN', 'admin.users.read'),
    ('SUPER_ADMIN', 'admin.users.status.update'),
    ('SUPER_ADMIN', 'admin.users.role.update'),
    ('SUPER_ADMIN', 'admin.subscriptions.read'),
    ('SUPER_ADMIN', 'admin.payments.read'),
    ('SUPER_ADMIN', 'admin.stats.read'),
    ('SUPER_ADMIN', 'authorization.permissions.read'),
    ('SUPER_ADMIN', 'authorization.permissions.manage');
