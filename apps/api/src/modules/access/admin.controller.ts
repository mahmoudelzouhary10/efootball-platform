import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { AuditPage, AuditService } from '../audit/audit.service';
import { Permission } from './permissions';
import { RequirePermissions } from './permissions.guard';

const auditQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
});

@Controller('admin')
export class AdminController {
  constructor(private readonly audit: AuditService) {}

  @Get('audit-logs')
  @RequirePermissions(Permission.AUDIT_LOG_READ)
  auditLogs(
    @Query(new ZodPipe(auditQuerySchema)) q: z.infer<typeof auditQuerySchema>,
  ): Promise<AuditPage> {
    return this.audit.list(q.limit, q.cursor);
  }
}
