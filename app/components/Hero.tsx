export function Hero() {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#e89a5a] to-[#d8884a] flex items-center justify-center text-white text-lg shadow-sm">
            🐾
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-wide text-[#3b2a1f] text-base">
              わんにゃん肖像
            </div>
            <div className="text-[11px] text-[#3b2a1f]/55">
              動物病院 × LINE 公式アカウント向け AI ペットイラスト
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#3b2a1f]/60">
          <Stat label="導入病院" value="32" />
          <Sep />
          <Stat label="累計生成数" value="48,210" />
          <Sep />
          <Stat label="平均処理" value="64秒" />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono tabular-nums font-semibold text-[#3b2a1f]">{value}</span>
      <span className="text-[#3b2a1f]/50">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="h-3 w-px bg-[#3b2a1f]/15" />;
}
