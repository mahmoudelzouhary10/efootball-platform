import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AppError } from '../../common/errors/app-error';
import { DB, Database } from '../../db/db.module';
import { PlatformRole, userRoles, users } from '../../db/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RoleService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  /**
   * Grants a platform role. `grantedBy` is null only for the bootstrap CLI (first admin).
   * Idempotent: granting an existing role is a no-op and is not re-logged.
   */
  async grant(username: string, role: PlatformRole, grantedBy: string | null): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [user] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));
      if (!user) throw AppError.notFound(`No user named ${username}`);
      const inserted = await tx
        .insert(userRoles)
        .values({ userId: user.id, role, grantedBy })
        .onConflictDoNothing()
        .returning({ role: userRoles.role });
      if (inserted.length) {
        await this.audit.record(
          {
            actorUserId: grantedBy,
            action: 'role.grant',
            targetType: 'user',
            targetId: user.id,
            metadata: { role },
          },
          tx,
        );
      }
    });
  }
}
