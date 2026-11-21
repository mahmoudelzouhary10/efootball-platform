import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PermissionsGuard } from './permissions.guard';
import { RoleService } from './role.service';

@Module({
  controllers: [AdminController],
  providers: [PermissionsGuard, RoleService],
  exports: [PermissionsGuard, RoleService],
})
export class AccessModule {}
