import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PlayersModule } from '../players/players.module';
import { AdminClansController } from './admin-clans.controller';
import { ClanApplicationsService } from './clan-applications.service';
import { ClanMembershipService } from './clan-membership.service';
import { ClanQueries } from './clan.queries';
import { ClansController } from './clans.controller';

@Module({
  imports: [PlayersModule, MediaModule],
  controllers: [ClansController, AdminClansController],
  providers: [ClanQueries, ClanApplicationsService, ClanMembershipService],
})
export class ClansModule {}
