export function Hero() {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-full bg-[#e89a5a] flex items-center justify-center text-white text-lg">
          🐾
        </div>
        <span className="font-semibold tracking-wide text-[#3b2a1f]">わんにゃん肖像</span>
        <span className="ml-2 text-[10px] uppercase tracking-widest text-[#3b2a1f]/50">
          動物病院向け AI ペットイラスト生成 — 動作プロトタイプ v2
        </span>
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-[#3b2a1f]">
        飼い主様の<span className="text-[#e89a5a]">LINE</span>から、
        <br className="hidden sm:inline" />
        ペットの今日のご様子を<span className="jp-brush text-[#d8884a]">温かい</span>
        <span className="text-[#e89a5a]">手書き風</span>イラストに。
      </h1>
      <p className="mt-3 text-sm sm:text-base text-[#3b2a1f]/70 max-w-3xl">
        本プロトタイプは、頂戴したご要件（LINE / LIFF 連携・5画風テンプレート・ロゴ合成・
        ペット個体特徴の保持・病院別管理画面・利用レポート・弊社管理画面・任意機能）の
        <strong className="text-[#3b2a1f]">全項目を可視化</strong>した動作プロトタイプです。
      </p>
    </header>
  );
}
