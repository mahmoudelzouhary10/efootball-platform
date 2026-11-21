import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CreatePlayerProfileInput,
  createPlayerProfileSchema,
  ErrorCode,
  PlayerProfileResponse,
  UpdatePlayerProfileInput,
  updatePlayerProfileSchema,
} from '@efp/contracts';
import { AppError } from '../../common/errors/app-error';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { CurrentAuth, Public } from '../identity/auth.decorators';
import type { AuthContext } from '../identity/session.service';
import { PlayersService } from './players.service';

@Controller()
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get('me/player-profile')
  async mine(@CurrentAuth() auth: AuthContext): Promise<PlayerProfileResponse> {
    const profile = await this.players.publicProfile(auth.username);
    if (!profile) throw new AppError(404, ErrorCode.PROFILE_REQUIRED, 'No player profile yet');
    return profile;
  }

  @Post('me/player-profile')
  create(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(createPlayerProfileSchema)) body: CreatePlayerProfileInput,
  ): Promise<PlayerProfileResponse> {
    return this.players.create(auth, body);
  }

  @Patch('me/player-profile')
  update(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(updatePlayerProfileSchema)) body: UpdatePlayerProfileInput,
  ): Promise<PlayerProfileResponse> {
    return this.players.update(auth, body);
  }

  /** Public player page. */
  @Public()
  @Get('players/:username')
  async byUsername(@Param('username') username: string): Promise<PlayerProfileResponse> {
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw AppError.notFound();
    const profile = await this.players.publicProfile(username);
    if (!profile) throw AppError.notFound();
    return profile;
  }
}
