"use client";

import { Card } from "./Card";

type Clinic = {
  id: string;
  name: string;
  area: string;
  status: "active" | "trial" | "paused";
  lineChannel: string;
  plan: "basic" | "standard" | "premium";
  thisMonth: number;
  joined: string;
};

const SAMPLE_CLINICS: Clinic[] = [
  { id: "c-001", name: "桜が丘どうぶつクリニック", area: "東京 / 世田谷区", status: "active", lineChannel: "@sakura-vet", plan: "standard", thisMonth: 320, joined: "2026-01-12" },
  { id: "c-002", name: "あおぞら動物病院", area: "東京 / 練馬区", status: "active", lineChannel: "@aozora-pet", plan: "premium", thisMonth: 487, joined: "2025-11-04" },
  { id: "c-003", name: "みどり動物病院", area: "神奈川 / 横浜市", status: "active", lineChannel: "@midori-vet", plan: "basic", thisMonth: 142, joined: "2026-02-20" },
  { id: "c-004", name: "わんぱく動物クリニック", area: "千葉 / 千葉市", status: "trial", lineChannel: "@wanpaku-vet", plan: "basic", thisMonth: 38, joined: "2026-05-01" },
  { id: "c-005", name: "ふくふく動物病院", area: "埼玉 / さいたま市", status: "active", lineChannel: "@fukufuku-pet", plan: "standard", thisMonth: 256, joined: "2026-03-15" },
  { id: "c-006", name: "ねこの森クリニック", area: "東京 / 杉並区", status: "paused", lineChannel: "@neko-mori", plan: "basic", thisMonth: 0, joined: "2025-09-08" },
];

export function SustainerAdminTab() {
  const totalActive = SAMPLE_CLINICS.filter((c) => c.status === "active").length;
  const totalMonth = SAMPLE_CLINICS.reduce((a, b) => a + b.thisMonth, 0);
  const trialCount = SAMPLE_CLINICS.filter((c) => c.status === "trial").length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-[#3b2a1f]">弊社（株式会社サスティナ） 管理画面</h2>
          <span className="text-[10px] uppercase tracking-widest text-[#3b2a1f]/50">
            Operator Console
          </span>
        </div>
        <p className="text-xs text-[#3b2a1f]/60 mb-4">
          病院アカウントの発行・停止、LINEチャネル接続、プラン管理、全社サマリーを管理いただけます。
        </p>

        <div className="grid sm:grid-cols-4 gap-3">
          <Stat label="稼働中の病院" value={totalActive.toString()} unit="件" />
          <Stat label="トライアル" value={trialCount.toString()} unit="件" />
          <Stat label="今月の総生成数" value={totalMonth.toLocaleString()} unit="件" />
          <Stat label="API推定費用" value={(totalMonth * 0.08).toFixed(0)} unit="USD" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#3b2a1f]">🏥 契約病院一覧</h3>
          <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e89a5a] text-white hover:bg-[#d8884a]">
            ＋ 新規病院アカウントを発行
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[#3b2a1f]/50 text-left">
              <tr className="border-b border-[#3b2a1f]/10">
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">病院名</th>
                <th className="py-2 pr-3 font-medium">エリア</th>
                <th className="py-2 pr-3 font-medium">LINE</th>
                <th className="py-2 pr-3 font-medium">プラン</th>
                <th className="py-2 pr-3 font-medium">今月の枚数</th>
                <th className="py-2 pr-3 font-medium">状態</th>
                <th className="py-2 pr-3 font-medium">登録日</th>
                <th className="py-2 pr-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CLINICS.map((c) => (
                <tr key={c.id} className="border-b border-[#3b2a1f]/5 text-[#3b2a1f]/85">
                  <td className="py-2.5 pr-3 font-mono">{c.id}</td>
                  <td className="py-2.5 pr-3 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-3">{c.area}</td>
                  <td className="py-2.5 pr-3 font-mono text-[10px]">{c.lineChannel}</td>
                  <td className="py-2.5 pr-3">
                    <PlanBadge plan={c.plan} />
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{c.thisMonth.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-2.5 pr-3 text-[#3b2a1f]/50">{c.joined}</td>
                  <td className="py-2.5 pr-3">
                    <button className="text-[10px] text-[#3b2a1f]/60 hover:text-[#3b2a1f] underline">
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="📈 月次サマリー（ダッシュボード）">
          <p className="text-xs text-[#3b2a1f]/60 mb-3">
            病院別の生成枚数の推移、画風別の人気、平均処理時間、エラー率などを可視化します。
          </p>
          <div className="rounded-2xl bg-gradient-to-br from-[#e89a5a]/8 to-[#f5b7c5]/8 border border-[#3b2a1f]/8 p-5 h-44 flex items-end gap-2">
            {SAMPLE_CLINICS.map((c, i) => (
              <div
                key={c.id}
                className="flex-1 rounded-t-lg bg-[#e89a5a] opacity-80 hover:opacity-100 transition relative group"
                style={{ height: `${(c.thisMonth / 500) * 100}%` }}
                title={`${c.name}: ${c.thisMonth}件`}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#3b2a1f]/60">
                  {c.thisMonth}
                </span>
                <span
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-[#3b2a1f]/50 whitespace-nowrap"
                  style={{ transform: `translate(-50%, 0) rotate(-30deg)`, transformOrigin: "top left", display: i % 1 === 0 ? "block" : "none" }}
                >
                  {c.id}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#3b2a1f]/40 mt-4">
            ※ Recharts / Chart.js 等での本実装を想定。
          </p>
        </Card>

        <Card title="💰 プラン体系（参考）">
          <div className="space-y-3 text-sm">
            <PlanRow
              plan="basic"
              monthly="¥9,800〜"
              quota="月100枚まで"
              features={["LINE連携", "5画風", "基本レポート"]}
            />
            <PlanRow
              plan="standard"
              monthly="¥19,800〜"
              quota="月300枚まで"
              features={["全機能", "ロゴ合成", "週次レポート", "優先サポート"]}
            />
            <PlanRow
              plan="premium"
              monthly="¥38,000〜"
              quota="月500枚 + 超過従量"
              features={["全機能", "カスタム画風", "API連携", "電話サポート"]}
            />
          </div>
          <p className="text-[10px] text-[#3b2a1f]/40 mt-4">
            ※ 価格は参考例。最終的なプラン設計は本制作時に貴社運営方針に合わせて調整します。
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#3b2a1f]/10 px-4 py-3">
      <div className="text-[11px] text-[#3b2a1f]/60">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-[#3b2a1f]">{value}</span>
        <span className="text-xs text-[#3b2a1f]/50">{unit}</span>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: Clinic["plan"] }) {
  const map = {
    basic: { label: "Basic", className: "bg-[#3b2a1f]/10 text-[#3b2a1f]/70" },
    standard: { label: "Standard", className: "bg-[#e89a5a]/15 text-[#d8884a]" },
    premium: { label: "Premium", className: "bg-[#f5b7c5]/35 text-[#a04a5a]" },
  }[plan];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map.className}`}>
      {map.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Clinic["status"] }) {
  const map = {
    active: { label: "稼働中", className: "bg-[#b5dac1]/40 text-[#1f6a3a]" },
    trial: { label: "試用中", className: "bg-[#f7d4b0]/50 text-[#a05a1f]" },
    paused: { label: "停止中", className: "bg-[#3b2a1f]/10 text-[#3b2a1f]/50" },
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map.className}`}>
      {map.label}
    </span>
  );
}

function PlanRow({
  plan,
  monthly,
  quota,
  features,
}: {
  plan: "basic" | "standard" | "premium";
  monthly: string;
  quota: string;
  features: string[];
}) {
  return (
    <div className="rounded-xl border border-[#3b2a1f]/10 bg-white px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="min-w-[5.5rem]">
        <PlanBadge plan={plan} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#3b2a1f]">{monthly}</div>
        <div className="text-[11px] text-[#3b2a1f]/60">{quota}</div>
      </div>
      <div className="text-[10px] text-[#3b2a1f]/60 flex flex-wrap gap-1">
        {features.map((f) => (
          <span key={f} className="px-2 py-0.5 rounded-full bg-[#3b2a1f]/5">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
