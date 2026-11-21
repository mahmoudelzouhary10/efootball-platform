import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  changeMemberRoleSchema,
  ClanApplicationResponse,
  ClanCardResponse,
  ClanDetailResponse,
  ClanInvitationResponse,
  ClanJoinRequestResponse,
  clanListQuerySchema,
  CreateClanApplicationInput,
  createClanApplicationSchema,
  inviteToClanSchema,
  joinRequestSchema,
  MyClanResponse,
  Page,
  transferLeadershipSchema,
  UpdateClanInput,
  updateClanSchema,
} from '@efp/contracts';
import type { Request } from 'express';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error';
import { requestMeta } from '../../common/http/request-meta';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { CurrentAuth, Public } from '../identity/auth.decorators';
import type { AuthContext } from '../identity/session.service';
import { PlayersService } from '../players/players.service';
import { ClanApplicationsService } from './clan-applications.service';
import { ClanMembershipService } from './clan-membership.service';
import { ClanPolicy } from './clan.policy';
import { ClanQueries } from './clan.queries';

const TAG_PATTERN = /^[A-Za-z0-9]{2,5}$/;

/** Validates the :tag path segment before it reaches a query. */
function tagParam(tag: string): string {
  if (!TAG_PATTERN.test(tag)) throw AppError.notFound('Clan not found');
  return tag.toUpperCase();
}

@Controller()
export class ClansController {
  constructor(
    private readonly queries: ClanQueries,
    private readonly applications: ClanApplicationsService,
    private readonly membership: ClanMembershipService,
    private readonly players: PlayersService,
  ) {}

  // ── discovery & public pages ──────────────────────────────────────────────

  @Public()
  @Get('clans')
  list(
    @Query(new ZodPipe(clanListQuerySchema)) q: z.infer<typeof clanListQuerySchema>,
  ): Promise<Page<ClanCardResponse>> {
    return this.queries.list(q.q, q.limit, q.cursor);
  }

  @Public()
  @Get('clans/:tag')
  async detail(@Param('tag') tag: string): Promise<ClanDetailResponse> {
    const clan = await this.queries.detailByTag(tagParam(tag));
    if (!clan) throw AppError.notFound('Clan not found');
    return clan;
  }

  // ── the caller's own clan situation ───────────────────────────────────────

  @Get('me/clan')
  async mine(@CurrentAuth() auth: AuthContext): Promise<MyClanResponse> {
    const me = await this.players.requireProfile(auth.userId);
    return this.queries.myClan(me.id);
  }

  // ── applications ──────────────────────────────────────────────────────────

  @Post('clan-applications')
  apply(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(createClanApplicationSchema)) body: CreateClanApplicationInput,
  ): Promise<ClanApplicationResponse> {
    return this.applications.apply(auth, body);
  }

  @Post('clan-applications/:id/withdraw')
  @HttpCode(204)
  withdraw(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.applications.withdraw(auth, id);
  }

  // ── clan management ───────────────────────────────────────────────────────

  @Patch('clans/:tag')
  @HttpCode(204)
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Body(new ZodPipe(updateClanSchema)) body: UpdateClanInput,
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.updateProfile(auth, tagParam(tag), body, requestMeta(req));
  }

  /** Pending invitations and join requests, visible to the leader and co-leaders only. */
  @Get('clans/:tag/pending')
  async pending(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
  ): Promise<{ invitations: ClanInvitationResponse[]; joinRequests: ClanJoinRequestResponse[] }> {
    const clan = await this.queries.detailByTag(tagParam(tag));
    if (!clan) throw AppError.notFound('Clan not found');
    if (!ClanPolicy.canManageRoster(await this.membership.roleOf(auth, clan.id)))
      throw AppError.forbidden();
    const [invitations, joinRequests] = await Promise.all([
      this.queries.invitations({ clanId: clan.id }),
      this.queries.joinRequests({ clanId: clan.id }),
    ]);
    return { invitations, joinRequests };
  }

  @Post('clans/:tag/invitations')
  @HttpCode(204)
  invite(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Body(new ZodPipe(inviteToClanSchema)) body: { username: string },
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.invite(auth, tagParam(tag), body.username, requestMeta(req));
  }

  @Post('clan-invitations/:id/revoke')
  @HttpCode(204)
  revoke(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.membership.revokeInvitation(auth, id, requestMeta(req));
  }

  @Post('clan-invitations/:id/accept')
  @HttpCode(204)
  accept(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.membership.acceptInvitation(auth, id, requestMeta(req));
  }

  @Post('clan-invitations/:id/decline')
  @HttpCode(204)
  decline(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.membership.declineInvitation(auth, id);
  }

  @Post('clans/:tag/join-requests')
  @HttpCode(204)
  requestToJoin(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Body(new ZodPipe(joinRequestSchema)) body: { message?: string | null },
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.requestToJoin(
      auth,
      tagParam(tag),
      body.message ?? null,
      requestMeta(req),
    );
  }

  @Post('clan-join-requests/:id/approve')
  @HttpCode(204)
  approveRequest(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.membership.decideJoinRequest(auth, id, 'approve', requestMeta(req));
  }

  @Post('clan-join-requests/:id/reject')
  @HttpCode(204)
  rejectRequest(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.membership.decideJoinRequest(auth, id, 'reject', requestMeta(req));
  }

  @Post('clan-join-requests/:id/cancel')
  @HttpCode(204)
  cancelRequest(@CurrentAuth() auth: AuthContext, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.membership.cancelJoinRequest(auth, id);
  }

  @Post('clans/:tag/members/:username/role')
  @HttpCode(204)
  changeRole(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Param('username') username: string,
    @Body(new ZodPipe(changeMemberRoleSchema)) body: { role: 'co_leader' | 'member' },
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.changeRole(auth, tagParam(tag), username, body.role, requestMeta(req));
  }

  @Post('clans/:tag/members/:username/kick')
  @HttpCode(204)
  kick(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Param('username') username: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.kick(auth, tagParam(tag), username, requestMeta(req));
  }

  @Post('clans/:tag/transfer-leadership')
  @HttpCode(204)
  transfer(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Body(new ZodPipe(transferLeadershipSchema)) body: { username: string },
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.transferLeadership(auth, tagParam(tag), body.username, requestMeta(req));
  }

  @Post('clans/:tag/leave')
  @HttpCode(204)
  leave(
    @CurrentAuth() auth: AuthContext,
    @Param('tag') tag: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.membership.leave(auth, tagParam(tag), requestMeta(req));
  }
}
