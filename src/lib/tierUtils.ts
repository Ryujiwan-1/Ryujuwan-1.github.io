import { Player } from "../types";

export const DEFAULT_TIER_SCORES: Record<string, number> = {
  unrank: 0, iron: 1, bronze: 2, silver: 3, gold: 4,
  platinum: 5, diamond: 6, ascendant: 7, immortal: 8, radiant: 9,
};

export const TIER_ORDER = [
  "iron","bronze","silver","gold","platinum",
  "diamond","ascendant","immortal","radiant",
];

export const SORT_TIER_ORDER = ["unrank", ...TIER_ORDER];
export const SORT_TIER_RANK: Record<string, number> =
  Object.fromEntries(SORT_TIER_ORDER.map((t, i) => [t, i]));

const TIER_ALIAS: Record<string, string> = {
  unlank: "unrank", unranked: "unrank", "언랭": "unrank",
};

export const normalizeTier = (tier: string): string => {
  const t = tier.trim().toLowerCase();
  return TIER_ALIAS[t] ?? t;
};

export const oneStepLower = (highest: string): string => {
  const t = normalizeTier(highest);
  const idx = TIER_ORDER.indexOf(t);
  return idx <= 0 ? "iron" : TIER_ORDER[idx - 1];
};

export const getEffectiveTier = (
  p: Pick<Player, "highest_tier" | "current_tier">
): string => {
  const cur = normalizeTier(p.current_tier);
  return cur === "unrank" ? oneStepLower(p.highest_tier) : cur;
};

export const getTotalGames = (p: Pick<Player, "wins" | "losses">): number =>
  p.wins + p.losses;

export const getRawWR = (p: Pick<Player, "wins" | "losses">): number => {
  const total = getTotalGames(p);
  return total === 0 ? 50 : Math.round((p.wins / total) * 10000) / 100;
};

export const getEffectiveWR = (p: Pick<Player, "wins" | "losses">): number => {
  const total = getTotalGames(p);
  const raw = getRawWR(p);
  if (total === 0) return 50;
  if (total < 10) return Math.round((50 + (raw - 50) * 0.5) * 100) / 100;
  return raw;
};

export const calcScore = (
  p: Player,
  tierScores: Record<string, number>
): number => {
  const highest = tierScores[normalizeTier(p.highest_tier)] ?? 0;
  const current = tierScores[getEffectiveTier(p)] ?? 0;
  const tierScore = highest * 0.4 + current * 0.6;
  const bonus = (getEffectiveWR(p) - 50) * 0.05;
  return Math.round((tierScore + bonus) * 100) / 100;
};
