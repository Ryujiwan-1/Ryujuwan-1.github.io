import { useState } from "react";
import { useStore } from "../store/useStore";
import {
  calcScore, getEffectiveTier, getTotalGames,
  getRawWR, getEffectiveWR, SORT_TIER_RANK, normalizeTier,
} from "../lib/tierUtils";
import { Player } from "../types";

type Col =
  | "name" | "highest" | "current" | "effective" | "position"
  | "wins" | "losses" | "total" | "raw_wr" | "eff_wr" | "score" | "memo";

const COLS: { key: Col; label: string }[] = [
  { key: "name",      label: "이름" },
  { key: "highest",   label: "최고 티어" },
  { key: "current",   label: "현재 티어" },
  { key: "effective", label: "계산용 티어" },
  { key: "position",  label: "포지션" },
  { key: "wins",      label: "승" },
  { key: "losses",    label: "패" },
  { key: "total",     label: "총판" },
  { key: "raw_wr",    label: "실제 승률" },
  { key: "eff_wr",    label: "반영 승률" },
  { key: "score",     label: "점수" },
  { key: "memo",      label: "메모" },
];

function sortKey(p: Player, col: Col, tierScores: Record<string, number>): string | number {
  switch (col) {
    case "name":      return p.name;
    case "highest":   return SORT_TIER_RANK[normalizeTier(p.highest_tier)] ?? -1;
    case "current":   return SORT_TIER_RANK[normalizeTier(p.current_tier)] ?? -1;
    case "effective": return SORT_TIER_RANK[getEffectiveTier(p)] ?? -1;
    case "position":  return p.preferred_position ?? "";
    case "wins":      return p.wins;
    case "losses":    return p.losses;
    case "total":     return getTotalGames(p);
    case "raw_wr":    return getRawWR(p);
    case "eff_wr":    return getEffectiveWR(p);
    case "score":     return calcScore(p, tierScores);
    case "memo":      return p.memo ?? "";
    default:          return "";
  }
}

export default function PlayerTable() {
  const { players, tierScores, setEditingPlayer, removePlayer } = useStore();
  const [sortCol, setSortCol] = useState<Col | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [search, setSearch] = useState("");

  let sorted = players;
  if (sortCol) {
    sorted = [...players].sort((a, b) => {
      const ka = sortKey(a, sortCol, tierScores);
      const kb = sortKey(b, sortCol, tierScores);
      const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
      return sortDesc ? -cmp : cmp;
    });
  }

  const filtered = search.trim()
    ? sorted.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted;

  const handleSort = (col: Col) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(false); }
  };

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!confirm(`'${name}' 인원을 삭제할까요?`)) return;
    removePlayer(name);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-bold text-gray-800 text-sm whitespace-nowrap">
          전체 등록 인원{" "}
          <span className="font-normal text-gray-400 text-xs">
            ({players.length}명 · 행 클릭 시 폼에 불러오기)
          </span>
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="닉네임 검색..."
          className="border rounded px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="overflow-auto max-h-[calc(100vh-11rem)]">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 sticky top-0 z-10">
              {COLS.map((c) => (
                <th key={c.key} onClick={() => handleSort(c.key)}
                  className="px-2 py-2 text-left font-semibold text-gray-600 cursor-pointer select-none whitespace-nowrap hover:bg-gray-200 border-b">
                  {c.label}{sortCol === c.key && (sortDesc ? " ▼" : " ▲")}
                </th>
              ))}
              <th className="px-2 py-2 font-semibold text-gray-600 border-b">-</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} className="text-center text-gray-400 py-10">
                  {players.length === 0
                    ? "등록된 인원이 없습니다 — 상단에서 JSON 파일을 불러오세요"
                    : "검색 결과가 없습니다"}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.name} onClick={() => setEditingPlayer(p)}
                className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors">
                <td className="px-2 py-1.5 font-medium whitespace-nowrap">{p.name}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{p.highest_tier}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{p.current_tier}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{getEffectiveTier(p)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{p.preferred_position || "미입력"}</td>
                <td className="px-2 py-1.5 text-center">{p.wins}</td>
                <td className="px-2 py-1.5 text-center">{p.losses}</td>
                <td className="px-2 py-1.5 text-center">{getTotalGames(p)}</td>
                <td className="px-2 py-1.5 text-center">{getRawWR(p)}%</td>
                <td className="px-2 py-1.5 text-center">{getEffectiveWR(p)}%</td>
                <td className="px-2 py-1.5 text-center font-semibold text-blue-600">
                  {calcScore(p, tierScores)}
                </td>
                <td className="px-2 py-1.5 text-gray-400 max-w-[8rem] truncate">{p.memo}</td>
                <td className="px-2 py-1.5">
                  <button onClick={(e) => handleDelete(e, p.name)}
                    className="text-red-400 hover:text-red-600 font-medium">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
