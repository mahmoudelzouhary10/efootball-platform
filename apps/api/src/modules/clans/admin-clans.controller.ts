import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  AdminClanApplicationResponse,
  AdminOverviewResponse,
  adminApplicationsQuerySchema,
  Page,
  RejectClanApplicationInput,
  rejectClanApplicationSchema,
} from '@efp/contracts';
import { eq, sql } from 'drizzle-orm';
import type { Request } from 'express';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error';
import { requestMeta } from '../../common/http/request-meta';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { DB, Database } from '../../db/db.module';
import { clans, playerProfiles, users } from '../../db/schema';
import { Permission } from '../access/permissions';
import { RequirePermissions } from '../access/permissions.guard';
import { CurrentAuth } from '../identity/auth.decorators';
import type { AuthContext } from '../identity/session.service';
import { ClanApplicationsService } from './clan-applications.service';

@Controller('admin')
export class AdminClansController {
  constructor(
    private readonly applications: ClanApplicationsService,
    @Inject(DB) private readonly db: Database,
  ) {}

  @Get('overview')
  @RequirePermissions(Permission.ADMIN_ACCESS)
  async overview(): Promise<AdminOverviewResponse> {
    const count = sql<number>`count(*)::int`;
    const [[u], [p], [c], pending] = await Promise.all([
      this.db.select({ n: count }).from(users),
      this.db.select({ n: count }).from(playerProfiles),
      this.db.select({ n: count }).from(clans).where(eq(clans.status, 'active')),
      this.applications.pendingCount(),
    ]);
    return { users: u!.n, players: p!.n, activeClans: c!.n, pendingClanApplications: pending };
  }

  @Get('clan-applications')
  @RequirePermissions(Permission.CLAN_APPLICATION_REVIEW)
  list(
    @Query(new ZodPipe(adminApplicationsQuerySchema))
    q: z.infer<typeof adminApplicationsQuerySchema>,
  ): Promise<Page<AdminClanApplicationResponse>> {
    return this.applications.list(q.status, q.limit, q.cursor);
  }

  @Get('clan-applications/:id')
  @RequirePermissions(Permission.CLAN_APPLICATION_REVIEW)
  async detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminClanApplicationResponse> {
    const app = await this.applications.detail(id);
    if (!app) throw AppError.notFound();
    return app;
  }

  @Post('clan-applications/:id/approve')
  @HttpCode(200)
  @RequirePermissions(Permission.CLAN_APPLICATION_REVIEW)
  approve(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<AdminClanApplicationResponse> {
    return this.applications.approve(auth.userId, id, requestMeta(req));
  }

  @Post('clan-applications/:id/reject')
  @HttpCode(200)
  @RequirePermissions(Permission.CLAN_APPLICATION_REVIEW)
  reject(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(rejectClanApplicationSchema)) body: RejectClanApplicationInput,
    @Req() req: Request,
  ): Promise<AdminClanApplicationResponse> {
    return this.applications.reject(auth.userId, id, body.reason, requestMeta(req));
  }
}
