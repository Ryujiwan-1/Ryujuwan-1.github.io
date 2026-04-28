import { create } from "zustand";
import { Player } from "../types";
import { DEFAULT_TIER_SCORES } from "../lib/tierUtils";

const GAME = "발로란트";
const LS_KEY = "team_splitter_v2";

function loadFromStorage(): { players: Player[]; active_players: string[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { players: [], active_players: [] };
    const data = JSON.parse(raw);
    const g = data?.games?.[GAME];
    if (!g) return { players: [], active_players: [] };
    return { players: g.players ?? [], active_players: g.active_players ?? [] };
  } catch {
    return { players: [], active_players: [] };
  }
}

function saveToStorage(players: Player[], activePlayers: string[]) {
  const data = {
    games: {
      [GAME]: { players, active_players: activePlayers },
    },
    tier_scores: DEFAULT_TIER_SCORES,
  };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

interface Store {
  players: Player[];
  activePlayers: string[];
  lastTeams: Player[][];
  tierScores: Record<string, number>;
  editingPlayer: Player | null;

  loadFromFile: (players: Player[]) => void;
  exportToFile: (filename: string) => void;
  setEditingPlayer: (p: Player | null) => void;
  addOrUpdatePlayer: (player: Player) => void;
  removePlayer: (name: string) => void;
  setActivePlayers: (names: string[]) => void;
  setLastTeams: (teams: Player[][]) => void;
  applyMatchResult: (winners: string[], losers: string[]) => void;
}

const init = loadFromStorage();

export const useStore = create<Store>((set, get) => ({
  players: init.players,
  activePlayers: init.active_players,
  lastTeams: [],
  tierScores: DEFAULT_TIER_SCORES,
  editingPlayer: null,

  loadFromFile: (players) => {
    saveToStorage(players, []);
    set({ players, activePlayers: [], lastTeams: [] });
  },

  exportToFile: (filename) => {
    const { players, activePlayers } = get();
    const data = {
      games: {
        [GAME]: { players, active_players: activePlayers },
      },
      tier_scores: DEFAULT_TIER_SCORES,
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith(".json") ? filename : filename + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  },

  setEditingPlayer: (editingPlayer) => set({ editingPlayer }),

  addOrUpdatePlayer: (player) => {
    const players = [...get().players];
    const idx = players.findIndex(
      (p) => p.name.toLowerCase() === player.name.toLowerCase()
    );
    if (idx >= 0) players[idx] = player;
    else players.push(player);
    saveToStorage(players, get().activePlayers);
    set({ players });
  },

  removePlayer: (name) => {
    const lo = name.toLowerCase();
    const players = get().players.filter((p) => p.name.toLowerCase() !== lo);
    const activePlayers = get().activePlayers.filter(
      (n) => n.toLowerCase() !== lo
    );
    saveToStorage(players, activePlayers);
    set({ players, activePlayers });
  },

  setActivePlayers: (names) => {
    const valid = new Set(get().players.map((p) => p.name));
    const seen = new Set<string>();
    const activePlayers = names.filter(
      (n) => valid.has(n) && !seen.has(n) && (seen.add(n), true)
    );
    saveToStorage(get().players, activePlayers);
    set({ activePlayers });
  },

  setLastTeams: (lastTeams) => set({ lastTeams }),

  applyMatchResult: (winners, losers) => {
    const wSet = new Set(winners.map((n) => n.toLowerCase()));
    const lSet = new Set(losers.map((n) => n.toLowerCase()));
    const players = get().players.map((p) => {
      const k = p.name.toLowerCase();
      if (wSet.has(k)) return { ...p, wins: p.wins + 1 };
      if (lSet.has(k)) return { ...p, losses: p.losses + 1 };
      return p;
    });
    saveToStorage(players, get().activePlayers);
    set({ players });
  },
}));
