import { Module } from '@nestjs/common';
import { PermissionsService } from '../auth/authorization/permissions.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PermissionsService],
  exports: [AdminService, PermissionsService],
})
export class AdminModule {}
