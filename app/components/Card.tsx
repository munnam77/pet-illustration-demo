export function Card({
  title,
  badge,
  accent = false,
  children,
}: {
  title?: string;
  badge?: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`paper rounded-3xl p-4 sm:p-5 ${accent ? "ring-1 ring-[#e89a5a]/30" : ""}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between mb-3 px-1">
          {title && <h3 className="font-semibold text-[#3b2a1f]">{title}</h3>}
          {badge && (
            <span
              className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                accent
                  ? "bg-[#e89a5a]/15 text-[#d8884a]"
                  : "bg-[#3b2a1f]/10 text-[#3b2a1f]/60"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
