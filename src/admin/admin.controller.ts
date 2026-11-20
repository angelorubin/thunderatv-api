import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/authorization/permissions';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsService } from '../auth/authorization/permissions.service';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('users')
  @RequirePermissions(Permissions.ADMIN_USERS_READ)
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('subscriptions')
  @RequirePermissions(Permissions.ADMIN_SUBSCRIPTIONS_READ)
  getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  @Get('payments')
  @RequirePermissions(Permissions.ADMIN_PAYMENTS_READ)
  getPayments() {
    return this.adminService.getPayments();
  }

  @Get('stats')
  @RequirePermissions(Permissions.ADMIN_STATS_READ)
  getStats() {
    return this.adminService.getStats();
  }

  @Patch('users/:id/status')
  @RequirePermissions(Permissions.ADMIN_USERS_STATUS_UPDATE)
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Patch('users/:id/role')
  @RequirePermissions(Permissions.ADMIN_USERS_ROLE_UPDATE)
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.updateUserRole(id, dto.role, user.sub);
  }

  @Get('roles/:role/permissions')
  @RequirePermissions(Permissions.AUTHORIZATION_PERMISSIONS_READ)
  getRolePermissions(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole,
  ) {
    return this.permissionsService.getRolePermissions(role);
  }

  @Put('roles/:role/permissions')
  @RequirePermissions(Permissions.AUTHORIZATION_PERMISSIONS_MANAGE)
  replaceRolePermissions(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole,
    @Body() dto: SetRolePermissionsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.permissionsService.replaceRolePermissions(
      role,
      dto.permissions,
      user.sub,
    );
  }
}
