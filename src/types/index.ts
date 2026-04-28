export interface Player {
  name: string;
  highest_tier: string;
  current_tier: string;
  preferred_position: string;
  wins: number;
  losses: number;
  memo: string;
}

// 파일 포맷: games["발로란트"].players + tier_scores
export interface PlayerFile {
  games: {
    [gameName: string]: {
      players: Player[];
      active_players?: string[];
    };
  };
  tier_scores?: Record<string, number>;
}
