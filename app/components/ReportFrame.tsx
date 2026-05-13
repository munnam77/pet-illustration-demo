"use client";

import { useMemo } from "react";
import type { Annotation } from "./types";

export function ReportFrame({
  petName,
  clinicName,
  imageUrl,
  loading,
  loadingMessage,
  elapsedSec,
  estimatedSec,
  annotations,
  fallbackUrl,
  closingText,
}: {
  petName: string;
  clinicName: string;
  imageUrl: string | null;
  loading: boolean;
  loadingMessage: string;
  elapsedSec: number;
  estimatedSec: number;
  annotations: Annotation[];
  fallbackUrl: string | null;
  closingText?: string;
}) {
  const leftAnnotations = useMemo(
    () => annotations.filter((a) => a.side === "left"),
    [annotations],
  );
  const rightAnnotations = useMemo(
    () => annotations.filter((a) => a.side === "right"),
    [annotations],
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-[#3b2a1f]/10 bg-[#fffaf2] relative">
      <div className="px-4 py-2.5 border-b border-[#3b2a1f]/10 flex items-center justify-between text-sm">
        <span className="handwritten text-lg text-[#d8884a]">
          🐾 本日のご様子をお送りします 🐾
        </span>
        <span className="text-[10px] text-[#3b2a1f]/50">{clinicName}</span>
      </div>

      <div className="relative aspect-square">
        {loading ? (
          <div className="absolute inset-0 shimmer flex flex-col items-center justify-center gap-3 px-6">
            <div className="bg-white/90 backdrop-blur rounded-2xl px-5 py-3 text-sm font-medium text-[#3b2a1f]/85 shadow text-center max-w-[90%]">
              ✨ {loadingMessage}
            </div>
            <div className="w-full max-w-[80%]">
              <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className="h-full bg-[#e89a5a] transition-all duration-1000 ease-linear"
                  style={{
                    width: `${Math.min(95, Math.round((elapsedSec / estimatedSec) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-[#3b2a1f]/60 mt-1.5 text-center">
                経過 {elapsedSec}秒 / 目安 約{estimatedSec}秒（OpenAI gpt-image-2）
              </p>
            </div>
          </div>
        ) : imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
        ) : fallbackUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackUrl}
              alt="placeholder"
              className="w-full h-full object-cover opacity-40 blur-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <p className="text-sm text-[#3b2a1f]/70">
                <strong>イラスト化する</strong> を押すと、
                <br />
                ここにAIが生成した手書き風イラストが表示されます。
              </p>
            </div>
          </>
        ) : null}

        {imageUrl && (
          <>
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[42%] space-y-3 z-10">
              {leftAnnotations.map((a) => (
                <Bubble key={a.id} annotation={a} side="left" />
              ))}
            </div>
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 max-w-[42%] space-y-3 z-10 text-right">
              {rightAnnotations.map((a) => (
                <Bubble key={a.id} annotation={a} side="right" />
              ))}
            </div>
          </>
        )}
      </div>

      {imageUrl && (
        <div className="px-4 py-3 border-t border-[#3b2a1f]/10 bg-[#fffaf2]">
          <p className="handwritten text-[15px] text-[#3b2a1f] leading-relaxed">
            {closingText ||
              `${petName}は本日も大きな変化はなく、安定して過ごしています。😊\n引き続き、しっかりとケアしてまいりますので、ご安心ください。`}
          </p>
        </div>
      )}
    </div>
  );
}

function Bubble({ annotation, side }: { annotation: Annotation; side: "left" | "right" }) {
  const colorBar = {
    pink: "bg-[#f5b7c5]",
    mint: "bg-[#b5dac1]",
    accent: "bg-[#f7d4b0]",
  }[annotation.color];
  return (
    <div className={`bubble ${side === "left" ? "tl" : "tr"}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3b2a1f]">
        <span className={`inline-block w-2 h-2 rounded-full ${colorBar}`} />
        {annotation.text}
      </div>
      <p className="text-[11px] text-[#3b2a1f]/70 mt-1 leading-snug">{annotation.detail}</p>
    </div>
  );
}
