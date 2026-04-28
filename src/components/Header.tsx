import { useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { Player } from "../types";

export default function Header() {
  const { exportToFile, loadFromFile } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("player_data");
  const [editingName, setEditingName] = useState(false);
  const [tmpName, setTmpName] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = JSON.parse(reader.result as string) as any;

        // ── 플레이어 배열 찾기 ──────────────────────────────────────
        // 지원 구조:
        //  A) { games: { "발로란트": { players: [...] } }, tier_scores: {...} }  ← 정상
        //  B) { games: { "발로란트": { players: [...] }, tier_scores: {...} } }  ← tier_scores 가 games 안에
        //  C) { games: { "발로란트": { players: [...], tier_scores: {...} } } }  ← tier_scores 가 game 안에
        //  D) { players: [...] }                                                 ← games 없이 바로 players

        let players: Player[] | null = null;

        if (json?.games && typeof json.games === "object") {
          // games 아래에서 players 배열을 가진 첫 번째 키를 찾음
          // (tier_scores 같은 비-게임 키는 자동으로 건너뜀)
          const gameKey = Object.keys(json.games).find(
            (k) => Array.isArray(json.games[k]?.players)
          );
          if (gameKey) {
            players = json.games[gameKey].players as Player[];
          }
        }

        // games 없이 최상위 players 배열인 경우
        if (!players && Array.isArray(json?.players)) {
          players = json.players as Player[];
        }

        if (!players) throw new Error("players 배열을 찾을 수 없습니다.");

        // 필수 필드 보완 & 타입 강제
        const normalized: Player[] = players.map((p) => ({
          name:               String(p.name ?? ""),
          highest_tier:       String(p.highest_tier ?? "iron"),
          current_tier:       String(p.current_tier ?? "iron"),
          preferred_position: String(p.preferred_position ?? ""),
          wins:               Number(p.wins ?? 0),
          losses:             Number(p.losses ?? 0),
          memo:               String(p.memo ?? ""),
        }));

        loadFromFile(normalized);
        setImportMsg(`✅ ${file.name} — ${normalized.length}명 불러오기 완료`);
      } catch (err) {
        setImportMsg(`❌ 파일 형식 오류: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const startEdit = () => { setTmpName(filename); setEditingName(true); };
  const confirmEdit = () => {
    const name = tmpName.trim();
    if (name) setFilename(name);
    setEditingName(false);
  };

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 space-y-2">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">
          ⚔️ 발로란트 내전 팀 나누기
        </h1>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          📂 파일 불러오기
        </button>

        <div className="flex items-center gap-1.5">
          {editingName ? (
            <>
              <input
                autoFocus value={tmpName}
                onChange={(e) => setTmpName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingName(false); }}
                className="border rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-400">.json</span>
              <button onClick={confirmEdit}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                확인
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                저장 파일명: <span className="font-semibold">{filename}.json</span>
              </span>
              <button onClick={startEdit} className="text-xs text-blue-500 hover:text-blue-700 underline">
                수정
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => exportToFile(filename)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          💾 파일 다운로드
        </button>

        <p className="text-xs text-gray-400 ml-auto">변경사항은 브라우저에 자동 저장됩니다</p>
      </div>

      {importMsg && (
        <p className={`text-xs px-3 py-1.5 rounded flex items-center justify-between ${
          importMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {importMsg}
          <button onClick={() => setImportMsg("")} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
        </p>
      )}
    </div>
  );
}
