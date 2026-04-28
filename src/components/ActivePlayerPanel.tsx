import { useState } from "react";
import { useStore } from "../store/useStore";
import { calcScore } from "../lib/tierUtils";
import { createBalancedTeams, getTeamScore, getPosSummary } from "../lib/balancer";

export default function ActivePlayerPanel() {
  const {
    players, activePlayers, tierScores,
    setActivePlayers, setLastTeams, lastTeams, applyMatchResult,
  } = useStore();

  const [numTeams, setNumTeams] = useState(2);
  // 승리팀: 카드 클릭으로 선택 (null = 미선택)
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [applyLog, setApplyLog] = useState("");
  const [selAll, setSelAll] = useState<string[]>([]);
  const [selActive, setSelActive] = useState<string[]>([]);
  const [searchAll, setSearchAll] = useState("");

  const activeSet = new Set(activePlayers);

  // 전체 인원 목록: 이미 참여 인원에 있는 사람 제외 + 검색 필터
  const availablePlayers = players.filter(
    (p) =>
      !activeSet.has(p.name) &&
      (searchAll.trim() === "" ||
        p.name.toLowerCase().includes(searchAll.trim().toLowerCase()))
  );

  const toggleAll = (name: string) =>
    setSelAll((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  const toggleActive = (name: string) =>
    setSelActive((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  const addToActive = () => {
    if (selAll.length === 0) return;
    const merged = [...activePlayers];
    for (const name of selAll) if (!merged.includes(name)) merged.push(name);
    setActivePlayers(merged);
    setSelAll([]);
  };

  const removeFromActive = () => {
    if (selActive.length === 0) return;
    setActivePlayers(activePlayers.filter((n) => !selActive.includes(n)));
    setSelActive([]);
    setLastTeams([]);
    setWinnerIdx(null);
    setApplyLog("");
  };

  const clearActive = () => {
    setActivePlayers([]);
    setLastTeams([]);
    setWinnerIdx(null);
    setApplyLog("");
  };

  const makeTeams = () => {
    const active = players.filter((p) => activePlayers.includes(p.name));
    if (active.length === 0) { alert("참여 인원을 먼저 선택하세요."); return; }
    try {
      setLastTeams(createBalancedTeams(active, numTeams, tierScores));
      setWinnerIdx(null);
      setApplyLog("");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleApply = () => {
    if (lastTeams.length === 0) return;
    if (winnerIdx === null) { alert("승리팀을 선택하세요. (팀 카드를 클릭하세요)"); return; }
    const winnerNames = lastTeams[winnerIdx].map((p) => p.name);
    const loserNames = lastTeams.flatMap((t, i) => i !== winnerIdx ? t.map((p) => p.name) : []);
    if (!confirm(
      `팀 ${winnerIdx + 1} 승리로 기록할까요?
+1승: ${winnerNames.join(", ")}
+1패: ${loserNames.join(", ")}`
    )) return;
    applyMatchResult(winnerNames, loserNames);
    setApplyLog(`✅ 팀 ${winnerIdx + 1} 승리 반영 — +1승: ${winnerNames.join(", ")} / +1패: ${loserNames.join(", ")}`);
  };

  const itemCls = (sel: boolean) =>
    `px-2 py-1 cursor-pointer select-none text-xs border-b last:border-0 transition-colors ${
      sel ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-gray-50"
    }`;

  const btnCls = (color: string) =>
    `${color} text-white px-3 py-1.5 rounded text-xs font-medium transition-colors`;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="font-bold text-gray-800 text-sm">참여 인원 선택 / 팀 나누기</h2>

      {/* 두 리스트 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 전체 인원 (참여 인원 제외) */}
        <div>
          <div className="flex items-center justify-between mb-1 gap-1">
            <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              전체 인원 ({availablePlayers.length})
            </p>
          </div>
          <input
            value={searchAll}
            onChange={(e) => setSearchAll(e.target.value)}
            placeholder="닉네임 검색..."
            className="border rounded px-2 py-1 text-xs w-full mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="border rounded h-40 overflow-y-auto">
            {availablePlayers.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">없음</p>
            )}
            {availablePlayers.map((p) => (
              <div key={p.name} className={itemCls(selAll.includes(p.name))} onClick={() => toggleAll(p.name)}>
                {p.name}{" "}
                <span className="text-gray-400">
                  | {p.preferred_position || "미입력"} | {p.wins}승 {p.losses}패 | {calcScore(p, tierScores)}점
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 참여 인원 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">참여 인원 ({activePlayers.length})</p>
          {/* 검색창 높이 맞추기용 spacer */}
          <div className="h-[28px] mb-1" />
          <div className="border rounded h-40 overflow-y-auto">
            {activePlayers.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">없음</p>
            )}
            {activePlayers.map((name) => (
              <div key={name} className={itemCls(selActive.includes(name))} onClick={() => toggleActive(name)}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={addToActive}      className={btnCls("bg-blue-500 hover:bg-blue-600")}>선택 추가 →</button>
        <button onClick={removeFromActive} className={btnCls("bg-orange-500 hover:bg-orange-600")}>← 선택 제거</button>
        <button onClick={clearActive}      className={btnCls("bg-gray-400 hover:bg-gray-500")}>초기화</button>
      </div>

      {/* 팀 나누기 */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">팀 수</label>
          <input type="number" min={1} value={numTeams}
            onChange={(e) => setNumTeams(Math.max(1, parseInt(e.target.value) || 2))}
            className="border rounded px-2 py-1 text-sm w-14 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={makeTeams}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors">
            팀 나누기 실행
          </button>
        </div>

        {/* 승리 반영 버튼 — 팀이 나뉜 후에만 표시 */}
        {lastTeams.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">
              {winnerIdx === null
                ? "👇 아래 팀 카드를 클릭해서 승리팀을 선택하세요"
                : `🏆 팀 ${winnerIdx + 1} 선택됨`}
            </p>
            <button
              onClick={handleApply}
              disabled={winnerIdx === null}
              className={`ml-auto px-4 py-1.5 rounded text-sm font-semibold transition-colors text-white ${
                winnerIdx !== null
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              승리 반영
            </button>
          </div>
        )}

        {applyLog && (
          <p className="text-xs text-green-700 bg-green-50 rounded p-2 leading-relaxed">
            {applyLog}
            <button onClick={() => setApplyLog("")} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
          </p>
        )}
      </div>

      {/* 팀 결과 — 카드 클릭으로 승리팀 선택 */}
      {lastTeams.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">
            팀 나누기 결과{" "}
            <span className="font-normal text-gray-400 text-xs">카드 클릭 → 승리팀 선택</span>
          </h3>
          <div className={`grid gap-2 ${lastTeams.length <= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {lastTeams.map((team, i) => {
              const score = getTeamScore(team, tierScores);
              const pos = getPosSummary(team);
              const isWinner = winnerIdx === i;
              return (
                <div
                  key={i}
                  onClick={() => setWinnerIdx(isWinner ? null : i)}
                  className={`border-2 rounded p-2.5 cursor-pointer transition-all select-none ${
                    isWinner
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">
                      팀 {i + 1}
                      {isWinner && (
                        <span className="ml-1.5 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                          🏆 승리팀
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">총점 {score}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1.5">
                    포지션: {Object.entries(pos).map(([k, v]) => `${k}×${v}`).join(", ")}
                  </p>
                  {team.map((p) => (
                    <div key={p.name}
                      className="text-xs py-0.5 border-b border-gray-200 last:border-0 leading-relaxed">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-gray-400">
                        {" "}| {p.highest_tier}→{p.current_tier} | {p.preferred_position || "미입력"}{" "}
                        | {p.wins}승 {p.losses}패 | {calcScore(p, tierScores)}점
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
