import type { ReactNode } from 'react';
import { MatchnightAdmin } from './admin';
import { MatchnightClan, MatchnightProfile } from './people';
import { MatchnightHome, MatchnightLive, MatchnightTournament, type ViewProps } from './screens';

export const MATCHNIGHT_SCREENS = [
  'home',
  'live',
  'tournament',
  'profile',
  'clan',
  'admin',
] as const;
export type MatchnightScreen = (typeof MATCHNIGHT_SCREENS)[number];
export const MATCHNIGHT: Record<MatchnightScreen, (p: ViewProps) => ReactNode> = {
  home: MatchnightHome,
  live: MatchnightLive,
  tournament: MatchnightTournament,
  profile: MatchnightProfile,
  clan: MatchnightClan,
  admin: MatchnightAdmin,
};
