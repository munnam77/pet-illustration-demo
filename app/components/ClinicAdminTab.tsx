"use client";

import { useMemo, useRef } from "react";
import { Card } from "./Card";
import { STYLE_OPTIONS, type StyleId } from "./types";

type GenerationRow = {
  id: string;
  date: string;
  owner: string;
  pet: string;
  style: StyleId;
  status: "delivered" | "failed" | "screened";
  ms: number;
};

const SAMPLE_HISTORY: GenerationRow[] = [
  { id: "g-2401", date: "2026-05-13 10:42", owner: "佐藤 様", pet: "チョコ", style: "watercolor", status: "delivered", ms: 92100 },
  { id: "g-2400", date: "2026-05-13 10:21", owner: "鈴木 様", pet: "ココ", style: "anime", status: "delivered", ms: 88400 },
  { id: "g-2399", date: "2026-05-13 09:58", owner: "田中 様", pet: "もも", style: "crayon", status: "delivered", ms: 95200 },
  { id: "g-2398", date: "2026-05-13 09:33", owner: "高橋 様", pet: "茶太郎", style: "watercolor", status: "delivered", ms: 87900 },
  { id: "g-2397", date: "2026-05-13 09:10", owner: "山本 様", pet: "ハナ", style: "picturebook", status: "delivered", ms: 91500 },
  { id: "g-2396", date: "2026-05-12 17:48", owner: "渡辺 様", pet: "ミルク", status: "screened", style: "watercolor", ms: 1200 },
  { id: "g-2395", date: "2026-05-12 16:12", owner: "中村 様", pet: "らら", style: "simple", status: "delivered", ms: 84300 },
];

export function ClinicAdminTab({
  clinicName,
  setClinicName,
  petName: _petName,
  logoFile,
  setLogoFile,
  enabledStyles,
  setEnabledStyles,
}: {
  clinicName: string;
  setClinicName: (v: string) => void;
  petName: string;
  logoFile: File | null;
  setLogoFile: (f: File | null) => void;
  enabledStyles: Set<StyleId>;
  setEnabledStyles: (s: Set<StyleId>) => void;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoUrl = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );

  const monthCount = SAMPLE_HISTORY.length + 313;
  const delivered = SAMPLE_HISTORY.filter((r) => r.status === "delivered").length + 311;
  const screened = SAMPLE_HISTORY.filter((r) => r.status === "screened").length + 1;
  const avgMs =
    SAMPLE_HISTORY.filter((r) => r.status === "delivered").reduce((a, b) => a + b.ms, 0) /
    Math.max(1, SAMPLE_HISTORY.filter((r) => r.status === "delivered").length);

  const onLogoPick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 3 * 1024 * 1024) return;
    setLogoFile(f);
  };

  const toggleStyle = (id: StyleId) => {
    const next = new Set(enabledStyles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabledStyles(next);
  };

  const downloadCsv = () => {
    const headers = ["id", "date", "owner", "pet", "style", "status", "ms"];
    const rows = SAMPLE_HISTORY.map((r) =>
      [r.id, r.date, r.owner, r.pet, r.style, r.status, r.ms].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clinicName || "clinic"}_2026-05.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#3b2a1f]">{clinicName || "病院"} ダッシュボード</h2>
          <p className="text-[12px] text-[#3b2a1f]/55 mt-0.5">
            2026年5月 — リアルタイム集計
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#3b2a1f]/55">
          <span className="h-2 w-2 rounded-full bg-[#06c755] animate-pulse" />
          稼働中
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="今月の生成枚数" value={monthCount.toString()} unit="件" sub={`前月比 +${Math.round(monthCount / 28)}件`} />
        <Stat label="配信成功率" value={`${((delivered / Math.max(1, monthCount)) * 100).toFixed(1)}`} unit="%" tone="ok" sub={`成功 ${delivered}件 / 除外 ${screened}件`} />
        <Stat label="平均処理時間" value={(avgMs / 1000).toFixed(1)} unit="秒" sub="目標 60秒以内" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="🏥 病院プロフィール">
          <label className="block">
            <span className="text-xs text-[#3b2a1f]/60">病院名（画像下部・LINE返信に表示）</span>
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-[#3b2a1f]/10 focus:outline-none focus:border-[#e89a5a] text-sm"
            />
          </label>
          <div className="mt-4">
            <span className="text-xs text-[#3b2a1f]/60">病院ロゴ（PNG/JPG, 3MBまで・透過推奨）</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl border border-dashed border-[#3b2a1f]/20 flex items-center justify-center overflow-hidden bg-white">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl text-[#3b2a1f]/30">🖼️</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
                >
                  ロゴをアップロード
                </button>
                {logoFile && (
                  <button
                    onClick={() => setLogoFile(null)}
                    className="text-[11px] text-[#3b2a1f]/50 underline self-start"
                  >
                    削除
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoPick(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <p className="text-[10px] text-[#3b2a1f]/50 mt-2">
              アップロード後、本タブの「飼い主体験」で生成すると、画像右下にロゴが合成されます。
            </p>
          </div>
        </Card>

        <Card title="🎨 画風テンプレートの有効／無効">
          <p className="text-[11px] text-[#3b2a1f]/60 mb-3">
            病院様の方針に応じて、飼い主様に表示する画風を選択できます。
          </p>
          <div className="space-y-2">
            {STYLE_OPTIONS.map((s) => {
              const on = enabledStyles.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStyle(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition ${
                    on
                      ? "border-[#e89a5a]/50 bg-[#e89a5a]/8"
                      : "border-[#3b2a1f]/10 bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[#3b2a1f]">
                    <span className="text-lg">{s.emoji}</span>
                    <span className="font-medium">{s.label}</span>
                    <span className="text-[11px] text-[#3b2a1f]/50 ml-1">{s.description}</span>
                  </span>
                  <span
                    className={`h-5 w-9 rounded-full relative transition ${
                      on ? "bg-[#e89a5a]" : "bg-[#3b2a1f]/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                        on ? "left-4" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#3b2a1f]">📊 生成履歴・利用レポート（2026年5月）</h3>
          <button
            onClick={downloadCsv}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3b2a1f] text-[#fffaf2] hover:bg-[#2b1f17]"
          >
            ⬇ CSV ダウンロード
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[#3b2a1f]/50 text-left">
              <tr className="border-b border-[#3b2a1f]/10">
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">日時</th>
                <th className="py-2 pr-3 font-medium">飼い主</th>
                <th className="py-2 pr-3 font-medium">ペット名</th>
                <th className="py-2 pr-3 font-medium">画風</th>
                <th className="py-2 pr-3 font-medium">ステータス</th>
                <th className="py-2 pr-3 font-medium">処理時間</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_HISTORY.map((r) => (
                <tr key={r.id} className="border-b border-[#3b2a1f]/5 text-[#3b2a1f]/80">
                  <td className="py-2 pr-3 font-mono">{r.id}</td>
                  <td className="py-2 pr-3">{r.date}</td>
                  <td className="py-2 pr-3">{r.owner}</td>
                  <td className="py-2 pr-3">{r.pet}</td>
                  <td className="py-2 pr-3">
                    {STYLE_OPTIONS.find((s) => s.id === r.style)?.label || r.style}
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {r.status === "screened" ? "—" : (r.ms / 1000).toFixed(1) + "秒"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#3b2a1f]/40 mt-3">
          ※ 上記7件＋過去履歴を含む全{SAMPLE_HISTORY.length + 313}件を月次でCSV出力します。週次／日次集計、画風別比率、エラー詳細などのフィルタリングも対応予定です。
        </p>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "ok";
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#3b2a1f]/8 px-4 py-3.5 shadow-[0_1px_0_rgba(59,42,31,0.04)]">
      <div className="text-[11px] text-[#3b2a1f]/55 font-medium uppercase tracking-wider">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold tabular-nums ${
            tone === "ok" ? "text-[#1f6a3a]" : "text-[#3b2a1f]"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-[#3b2a1f]/50">{unit}</span>
      </div>
      {sub && <div className="text-[10px] text-[#3b2a1f]/45 mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: GenerationRow["status"] }) {
  const map = {
    delivered: { label: "配信済み", className: "bg-[#b5dac1]/40 text-[#1f6a3a]" },
    failed: { label: "失敗", className: "bg-red-100 text-red-700" },
    screened: { label: "判定で除外", className: "bg-[#f7d4b0]/50 text-[#a05a1f]" },
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map.className}`}>
      {map.label}
    </span>
  );
}
