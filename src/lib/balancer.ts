import { Player } from "../types";
import { calcScore } from "./tierUtils";

export function createBalancedTeams(
  players: Player[],
  numTeams: number,
  tierScores: Record<string, number>
): Player[][] {
  if (numTeams <= 0) throw new Error("팀 수는 1 이상이어야 합니다.");
  if (players.length < numTeams) throw new Error("플레이어 수보다 팀 수가 많습니다.");

  const cache = new Map(players.map((p) => [p.name, calcScore(p, tierScores)]));
  const sorted = [...players].sort(
    (a, b) => (cache.get(b.name) ?? 0) - (cache.get(a.name) ?? 0)
  );

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);
  let idx = 0, dir = 1;
  for (const p of sorted) {
    teams[idx].push(p);
    const next = idx + dir;
    if (next >= 0 && next < numTeams) idx = next;
    else { dir *= -1; idx += dir; }
  }

  const scores = teams.map((t) => teamScore(t, cache));
  for (;;) {
    const maxI = scores.indexOf(Math.max(...scores));
    const minI = scores.indexOf(Math.min(...scores));
    if (scores[maxI] - scores[minI] <= 0.5) break;

    let best: [number, number, number, number] | null = null;
    let bestGap = scores[maxI] - scores[minI];

    for (let i = 0; i < teams[maxI].length; i++) {
      for (let j = 0; j < teams[minI].length; j++) {
        const s1 = cache.get(teams[maxI][i].name) ?? 0;
        const s2 = cache.get(teams[minI][j].name) ?? 0;
        const nm = scores[maxI] - s1 + s2;
        const nn = scores[minI] - s2 + s1;
        const gap = Math.abs(nm - nn);
        if (gap < bestGap) { bestGap = gap; best = [i, j, nm, nn]; }
      }
    }
    if (!best) break;
    const [i, j, nm, nn] = best;
    [teams[maxI][i], teams[minI][j]] = [teams[minI][j], teams[maxI][i]];
    scores[maxI] = nm;
    scores[minI] = nn;
  }

  return teams;
}

function teamScore(team: Player[], cache: Map<string, number>): number {
  return Math.round(team.reduce((s, p) => s + (cache.get(p.name) ?? 0), 0) * 100) / 100;
}

export function getTeamScore(
  team: Player[],
  tierScores: Record<string, number>
): number {
  return Math.round(
    team.reduce((s, p) => s + calcScore(p, tierScores), 0) * 100
  ) / 100;
}

export function getPosSummary(team: Player[]): Record<string, number> {
  return team.reduce((acc, p) => {
    const pos = p.preferred_position || "미입력";
    acc[pos] = (acc[pos] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
