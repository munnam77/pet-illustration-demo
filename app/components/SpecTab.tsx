"use client";

import { Card } from "./Card";

export function SpecTab() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-[#3b2a1f]">技術仕様 / 提案概要</h2>
          <span className="text-[10px] uppercase tracking-widest text-[#3b2a1f]/50">
            Tech Stack & Estimates
          </span>
        </div>
        <p className="text-xs text-[#3b2a1f]/60">
          頂戴したご要件への弊社からの推奨技術構成と、本プロトタイプで使用している実装をまとめています。
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="🧱 推奨技術構成">
          <ul className="space-y-2.5 text-sm text-[#3b2a1f]/85">
            <Row k="フロントエンド" v="Next.js 16 + React 19 + Tailwind 4（LIFF対応）" />
            <Row k="バックエンド" v="Next.js API Routes（Node.js 22 / Edge互換）" />
            <Row k="LINE 連携" v="Messaging API（Webhook受信 / Push送信） + LIFF" />
            <Row k="AI 画像生成" v="OpenAI gpt-image-2（image.edit） — 必要に応じ Gemini Image / Stable Diffusion + ControlNet を選択肢" />
            <Row k="不適切検出" v="OpenAI gpt-4o-mini Vision で事前判定" />
            <Row k="ロゴ合成" v="sharp（Node.js）でサーバーサイド合成" />
            <Row k="DB" v="Supabase (PostgreSQL) — 病院・利用ログ・トークン管理" />
            <Row k="ストレージ" v="Cloudflare R2 / Supabase Storage（生成画像保存）" />
            <Row k="インフラ" v="Vercel（API + フロント）/ 月間予測トラフィックで自動スケール" />
            <Row k="監視" v="Vercel Analytics + Sentry + ステータス通知（Slack/Email）" />
          </ul>
        </Card>

        <Card title="🎯 個体特徴の保持アプローチ">
          <ol className="space-y-2.5 text-sm text-[#3b2a1f]/85 list-decimal pl-4">
            <li>
              <strong>第一段階：</strong>OpenAI <code className="bg-[#3b2a1f]/5 px-1 rounded">gpt-image-2</code> の <code className="bg-[#3b2a1f]/5 px-1 rounded">image.edit</code>（写真を入力としてイラスト化）。
              元写真の毛色・耳形・体格・表情を保持しやすく、本プロトタイプもこちらを採用。
            </li>
            <li>
              <strong>第二段階（クオリティ向上）：</strong> Stable Diffusion + <em>IP-Adapter</em> / <em>ControlNet (Reference / Tile / Lineart)</em> で
              個体写真を condition として渡し、画風モデル（手書きLoRA）と組み合わせて識別精度を向上。
            </li>
            <li>
              <strong>第三段階（必要に応じ）：</strong> Gemini 2.5 Image (nano banana) も併用候補。
              モデルABテストを行い、最良の組み合わせを選定。
            </li>
            <li>
              <strong>事後処理：</strong>NO BUBBLES プロンプト＋HTML/CSSオーバーレイで吹き出しを完全に透過。
              アイコン・ロゴはサーバー側で sharp により合成。
            </li>
          </ol>
          <p className="text-[11px] text-[#3b2a1f]/55 mt-3">
            ※ 詳細な品質要件確認後、モデル選定と最適化方針を確定します（要件定義フェーズ含む）。
          </p>
        </Card>
      </div>

      <Card title="⚡ パフォーマンス / コスト目安">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="1枚の生成時間" value="90秒〜2分" sub="gpt-image-2 medium / 1024px" />
          <MetricCard label="同時接続" value="20+" sub="Vercel サーバーレスは水平スケール" />
          <MetricCard label="API原価" value="¥10〜15" sub="1枚あたり（OpenAI medium）" />
          <MetricCard label="月運用費" value="¥3,000〜" sub="Vercel + Supabase + 監視（病院10件想定）" />
        </div>
        <p className="text-[11px] text-[#3b2a1f]/55 mt-4">
          ※ 1枚あたりの目標：待合室での体感として 60〜120秒を許容範囲と想定。プロンプト最適化＋画像サイズ調整で短縮可能。
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="📦 ご見積り（2パターン）">
          <div className="space-y-3">
            <QuoteRow
              title="MVP版（段階開発・第1リリース）"
              price="¥350,000 〜 ¥450,000"
              months="約 6〜8 週間"
              points={[
                "LINE Bot連携（Webhook受信 / Push送信）",
                "LIFF UI（写真選択・画風選択・ロゴ表示有無）",
                "AI画像生成（gpt-image-2、3画風）",
                "ロゴ合成（クライアント設定）",
                "基本管理画面（病院プロフィール / 利用ログ閲覧）",
                "弊社管理画面の最小版（病院アカウント発行）",
                "ソースコード譲渡＋導入支援",
              ]}
              note="まずコア機能で本番運用 → 利用データを見ながら拡張"
            />
            <QuoteRow
              title="フルスペック版（必須機能をすべて含む）"
              price="¥800,000 〜 ¥1,200,000"
              months="約 14〜18 週間"
              points={[
                "必須機能すべて（LINE連携 / LIFF / AI生成 / ロゴ合成 / 5〜6画風）",
                "病院管理画面（プロフィール・テンプレ・ロゴ・履歴・月次レポート・CSV）",
                "弊社管理画面（病院アカウントCRUD・プラン管理・全社ダッシュボード）",
                "生成枚数・利用ユーザー数集計（病院別／月次／CSV）",
                "任意機能：不適切画像検出・コメント編集・高齢者向けUI・チュートリアル",
                "ソースコード譲渡＋本番デプロイ＋運用ドキュメント",
              ]}
              recommended
              note="貴社の長期運用を想定した推奨構成"
            />
          </div>
          <p className="text-[11px] text-[#3b2a1f]/55 mt-3">
            ※ 上記は参考レンジ。要件定義の結果、ロゴ提供形式・LINEチャネル数・運用フローにより調整します。
          </p>
        </Card>

        <Card title="🛠 月額保守契約">
          <div className="space-y-3 text-sm text-[#3b2a1f]/85">
            <MaintenanceTier
              tier="Basic"
              price="¥30,000 / 月"
              scope={[
                "サーバー監視・障害一次対応（営業時間内）",
                "ライブラリ／API仕様変更への追従",
                "月2時間までの軽微修正",
              ]}
            />
            <MaintenanceTier
              tier="Standard"
              price="¥55,000 / 月"
              scope={[
                "Basicの全範囲",
                "月5時間までの軽微改修・新画風追加",
                "優先サポート（Slack / メール）",
                "週次のヘルスレポート",
              ]}
              recommended
            />
            <MaintenanceTier
              tier="Premium"
              price="¥85,000 / 月"
              scope={[
                "Standardの全範囲",
                "月10時間までの改修対応",
                "緊急時の即時対応（24時間以内）",
                "新機能の定期リリース計画",
              ]}
            />
          </div>
          <p className="text-[11px] text-[#3b2a1f]/55 mt-3">
            ※ ランサーズ外での直接契約（業務委託契約）も対応可能です。
          </p>
        </Card>
      </div>

      <Card title="📅 スケジュール（フルスペック想定）">
        <div className="grid sm:grid-cols-5 gap-2 text-[11px]">
          <Phase no="①" weeks="1〜2週" label="要件定義 / 設計" />
          <Phase no="②" weeks="3〜6週" label="コア機能（LINE / LIFF / AI生成）" />
          <Phase no="③" weeks="7〜10週" label="管理画面（病院 / 弊社）・レポート" />
          <Phase no="④" weeks="11〜14週" label="任意機能・QA・負荷試験" />
          <Phase no="⑤" weeks="15〜18週" label="UAT・本番リリース・引き渡し" />
        </div>
        <p className="text-[11px] text-[#3b2a1f]/55 mt-3">
          ※ MVP版で6〜8週間でのリリースも可能。発注後できるだけ早期の公開希望に合わせ、段階開発もご提案できます。
        </p>
      </Card>

      <Card title="🔒 セキュリティ / 運用ポリシー">
        <ul className="space-y-2 text-sm text-[#3b2a1f]/85 list-disc pl-5">
          <li>飼い主写真は生成完了後 24 時間で自動削除（または病院様の選択により非保存）</li>
          <li>LINE トークン・APIキーは Vercel 環境変数で暗号化保管（リポジトリ非含有）</li>
          <li>病院ごとのデータ分離（PostgreSQL Row Level Security）</li>
          <li>不適切画像（人物・無関係画像）の事前判定で誤投稿を防止</li>
          <li>API レート制限（病院単位） / 不正アクセス検知ログ</li>
        </ul>
      </Card>

      <Card title="🧠 過去の関連実績">
        <ul className="space-y-2 text-sm text-[#3b2a1f]/85 list-disc pl-5">
          <li>
            <strong>BrandGuard AI</strong> — AI画像／文章生成（GPT-image・GPT-4）+ ブランドガイドライン整合性チェックSaaS
          </li>
          <li>
            <strong>LINE OAコンサル AI Bot</strong> — LINE Messaging API + GPT による自動応答／チャット履歴管理
          </li>
          <li>
            <strong>EIMEI 写真選定 AI</strong> — 大量写真からのスマート選定 AI（教育向け）
          </li>
          <li>
            <strong>MEMORIA.ai</strong> — 高齢者向けライフログ生成 AI（LINE & Web）
          </li>
        </ul>
        <p className="text-[11px] text-[#3b2a1f]/55 mt-3">
          詳細実績・ご参考URLは別途お送りします（<a className="underline" href="https://cognitiveappdev.com">cognitiveappdev.com</a>）。
        </p>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex gap-3 leading-snug">
      <span className="min-w-[7rem] text-[12px] text-[#3b2a1f]/55 font-medium">{k}</span>
      <span className="text-sm">{v}</span>
    </li>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[#3b2a1f]/10 bg-white px-4 py-3">
      <div className="text-[11px] text-[#3b2a1f]/55">{label}</div>
      <div className="text-xl font-bold text-[#3b2a1f] mt-0.5">{value}</div>
      <div className="text-[10px] text-[#3b2a1f]/50 mt-1">{sub}</div>
    </div>
  );
}

function QuoteRow({
  title,
  price,
  months,
  points,
  recommended,
  note,
}: {
  title: string;
  price: string;
  months: string;
  points: string[];
  recommended?: boolean;
  note?: string;
}) {
  return (
    <div
      className={`rounded-2xl border ${
        recommended ? "border-[#e89a5a]/50 bg-[#e89a5a]/5" : "border-[#3b2a1f]/10 bg-white"
      } p-4 relative`}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-[#e89a5a] text-white text-[10px] font-semibold">
          推奨
        </span>
      )}
      <h4 className="font-semibold text-[#3b2a1f] text-sm">{title}</h4>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-xl font-bold text-[#3b2a1f]">{price}</span>
        <span className="text-xs text-[#3b2a1f]/55">/ 開発期間 {months}</span>
      </div>
      <ul className="mt-3 space-y-1 text-[12px] text-[#3b2a1f]/80 list-disc pl-5">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {note && <p className="text-[11px] text-[#3b2a1f]/55 mt-2.5">— {note}</p>}
    </div>
  );
}

function MaintenanceTier({
  tier,
  price,
  scope,
  recommended,
}: {
  tier: string;
  price: string;
  scope: string[];
  recommended?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${
        recommended ? "border-[#e89a5a]/50 bg-[#e89a5a]/5" : "border-[#3b2a1f]/10 bg-white"
      } p-3`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#3b2a1f] text-sm">{tier}</span>
        <span className="text-sm font-bold text-[#3b2a1f]">{price}</span>
        {recommended && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#e89a5a] text-white text-[9px] font-semibold">
            推奨
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] text-[#3b2a1f]/75 list-disc pl-5">
        {scope.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function Phase({ no, weeks, label }: { no: string; weeks: string; label: string }) {
  return (
    <div className="rounded-xl bg-white border border-[#3b2a1f]/10 px-3 py-2.5 text-center">
      <div className="text-[#e89a5a] font-bold">{no}</div>
      <div className="font-mono text-[10px] text-[#3b2a1f]/60 mt-0.5">{weeks}</div>
      <div className="text-[11px] text-[#3b2a1f]/85 mt-1 leading-tight">{label}</div>
    </div>
  );
}
