import { Inject, Injectable } from '@nestjs/common';
import { desc, getTableColumns, sql } from 'drizzle-orm';
import { DB, Database, DbExecutor } from '../../db/db.module';
import { auditLogs } from '../../db/schema';

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

export interface AuditPage {
  items: (typeof auditLogs.$inferSelect)[];
  nextCursor: string | null;
}

/**
 * Append-only audit trail. Pass the open transaction so the log entry commits
 * (or rolls back) together with the change it describes.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async record(entry: AuditEntry, executor: DbExecutor = this.db): Promise<void> {
    await executor.insert(auditLogs).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? null,
      ip: entry.ip ?? null,
    });
  }

  /**
   * Newest first, keyset pagination on (created_at, id). The cursor carries created_at as
   * Postgres text so microsecond precision survives the round trip (JS Dates keep only ms).
   */
  async list(limit: number, cursor?: string): Promise<AuditPage> {
    const after = cursor ? decodeCursor(cursor) : null;
    const rows = await this.db
      .select({
        ...getTableColumns(auditLogs),
        createdAtText: sql<string>`${auditLogs.createdAt}::text`,
      })
      .from(auditLogs)
      .where(
        after
          ? sql`(${auditLogs.createdAt}, ${auditLogs.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
          : undefined,
      )
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(({ createdAtText: _ignored, ...row }) => row),
      nextCursor: rows.length > limit && last ? encodeCursor(last.createdAtText, last.id) : null,
    };
  }
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url');
}

/** Returns null for malformed cursors (treated as "first page"). */
function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  const [ts, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  if (!ts || Number.isNaN(Date.parse(ts)) || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { createdAt: ts, id };
}
