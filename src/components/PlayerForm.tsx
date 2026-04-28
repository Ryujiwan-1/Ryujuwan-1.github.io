import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { Player } from "../types";
import { TIER_ORDER } from "../lib/tierUtils";

const EMPTY: Player = {
  name: "", highest_tier: "", current_tier: "",
  preferred_position: "", wins: 0, losses: 0, memo: "",
};

const POSITIONS = ["엔트리", "척후대", "연막", "감시자", "올라운더"];

const inputCls =
  "border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs font-semibold text-gray-600">{label}</label>
    {children}
  </div>
);

export default function PlayerForm() {
  const { editingPlayer, setEditingPlayer, addOrUpdatePlayer } = useStore();
  const [form, setForm] = useState<Player>(EMPTY);

  useEffect(() => {
    if (editingPlayer) setForm(editingPlayer);
  }, [editingPlayer]);

  const upd = (key: keyof Player, val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim()) { alert("이름을 입력하세요."); return; }
    if (!form.highest_tier) { alert("최고 티어를 선택하세요."); return; }
    if (!form.current_tier) { alert("현재 티어를 선택하세요."); return; }
    if (form.wins < 0 || form.losses < 0) { alert("승/패는 0 이상이어야 합니다."); return; }
    addOrUpdatePlayer({ ...form, name: form.name.trim() });
    setForm(EMPTY);
    setEditingPlayer(null);
  };

  const handleClear = () => { setForm(EMPTY); setEditingPlayer(null); };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2.5">
      <h2 className="font-bold text-gray-800 text-sm">인원 등록 / 수정</h2>

      <Field label="이름">
        <input value={form.name} onChange={(e) => upd("name", e.target.value)}
          className={inputCls} placeholder="닉네임" />
      </Field>

      <Field label="최고 티어">
        <select value={form.highest_tier} onChange={(e) => upd("highest_tier", e.target.value)} className={inputCls}>
          <option value="">선택</option>
          {TIER_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="현재 티어">
        <select value={form.current_tier} onChange={(e) => upd("current_tier", e.target.value)} className={inputCls}>
          <option value="">선택</option>
          <option value="unrank">unrank</option>
          {TIER_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="선호 포지션">
        <select value={form.preferred_position} onChange={(e) => upd("preferred_position", e.target.value)} className={inputCls}>
          <option value="">선택</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="승">
          <input type="number" min={0} value={form.wins}
            onChange={(e) => upd("wins", Math.max(0, parseInt(e.target.value) || 0))}
            className={inputCls} />
        </Field>
        <Field label="패">
          <input type="number" min={0} value={form.losses}
            onChange={(e) => upd("losses", Math.max(0, parseInt(e.target.value) || 0))}
            className={inputCls} />
        </Field>
      </div>

      <Field label="메모">
        <input value={form.memo} onChange={(e) => upd("memo", e.target.value)} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors">
          저장
        </button>
        <button onClick={handleClear}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
          초기화
        </button>
      </div>

      <div className="text-xs text-gray-400 bg-gray-50 rounded p-2 space-y-0.5 leading-relaxed">
        <p className="font-semibold text-gray-500">💡 팁</p>
        <p>• unrank → 최고 티어 한 단계 낮게 계산</p>
        <p>• 총판 10 미만: 승률 영향 50% 감소</p>
        <p>• 같은 이름 저장 시 덮어쓰기</p>
        <p>• 표 행 클릭 시 폼에 자동 입력</p>
      </div>
    </div>
  );
}
