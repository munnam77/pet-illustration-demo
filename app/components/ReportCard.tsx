"use client";

import { forwardRef, useMemo } from "react";
import {
  CloudBubbleSvg,
  DropletSvg,
  FlowerOutlineSvg,
  HandDrawnArrow,
  HeartOutlineSvg,
  PawStampSvg,
  SparkleSvg,
  StarOutlineSvg,
  TitleDashSvg,
} from "./SvgGraphics";
import {
  FALLBACK_TARGETS,
  type Annotation,
  type BubblePosition,
  type FeatureTarget,
  type IconType,
} from "./types";

// Bubble positioning (percent of canvas). The bubble's anchor is its top-left.
// These match the reference image layout: TL/TR top, ML/MR middle, BL/BR bottom.
const BUBBLE_LAYOUT: Record<BubblePosition, { left: string; top: string }> = {
  tl: { left: "3%", top: "8%" },
  tr: { left: "60%", top: "8%" },
  ml: { left: "3%", top: "36%" },
  mr: { left: "60%", top: "44%" },
  bl: { left: "3%", top: "66%" },
  br: { left: "55%", top: "70%" },
};

// Where the arrow ORIGIN sits relative to each bubble.
const ARROW_ORIGIN: Record<BubblePosition, { dx: number; dy: number }> = {
  tl: { dx: 0.95, dy: 0.85 },
  tr: { dx: 0.05, dy: 0.85 },
  ml: { dx: 0.95, dy: 0.5 },
  mr: { dx: 0.05, dy: 0.5 },
  bl: { dx: 0.95, dy: 0.15 },
  br: { dx: 0.05, dy: 0.15 },
};

export type ReportCardProps = {
  imageUrl: string;
  petName: string;
  clinicName: string;
  annotations: Annotation[];
  closingText?: string;
  featureCoords?: Partial<Record<FeatureTarget, { x: number; y: number }>>;
  width?: number; // px — the rendered canvas width
  showArrows?: boolean;
};

export const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(function ReportCard(
  {
    imageUrl,
    petName,
    clinicName,
    annotations,
    closingText,
    featureCoords,
    width = 720,
    showArrows = true,
  },
  ref,
) {
  // Canvas is portrait, 3:4 ratio (matches reference).
  const height = (width * 4) / 3;

  const targets = useMemo(
    () => ({ ...FALLBACK_TARGETS, ...(featureCoords || {}) }),
    [featureCoords],
  );

  const finalClosing =
    closingText ||
    `本日も大きな変化はなく、安定して過ごしています。☺︎\n引き続き、しっかりとケアしてまいりますので、ご安心ください。❤︎`;

  return (
    <div
      ref={ref}
      style={{
        width,
        background: "#fdf6e8",
        boxShadow: "0 1px 0 rgba(59,42,31,0.04), 0 20px 50px -20px rgba(59,42,31,0.18)",
        border: "1px solid rgba(59,42,31,0.08)",
        borderRadius: 22,
        overflow: "hidden",
        fontFamily: "var(--font-jp-handwritten), 'Klee One', sans-serif",
        color: "#3b2a1f",
      }}
    >
      {/* Title strip */}
      <div
        style={{
          padding: "16px 24px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#fdf6e8",
        }}
      >
        <TitleDashSvg />
        <PawStampSvg size={20} color="#D8884A" opacity={0.7} />
        <span
          className="jp-brush"
          style={{
            fontSize: 26,
            color: "#D8884A",
            fontWeight: 400,
            letterSpacing: "0.04em",
          }}
        >
          本日のご様子をお送りします
        </span>
        <PawStampSvg size={20} color="#D8884A" opacity={0.7} />
        <TitleDashSvg />
      </div>

      {/* Photo canvas with overlays */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          background: "#fdf6e8",
        }}
      >
        {/* Pet photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={petName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Corner paw stamps */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <PawStampSvg size={28} color="#B89070" opacity={0.55} />
        </div>
        <div style={{ position: "absolute", top: 12, right: 16 }}>
          <PawStampSvg size={26} color="#B89070" opacity={0.55} />
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 12 }}>
          <PawStampSvg size={26} color="#B89070" opacity={0.55} />
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 8 }}>
          <PawStampSvg size={30} color="#B89070" opacity={0.55} />
        </div>

        {/* Scatter accents */}
        <div style={{ position: "absolute", top: "26%", left: "30%" }}>
          <HeartOutlineSvg size={18} />
        </div>
        <div style={{ position: "absolute", top: "60%", left: "8%" }}>
          <HeartOutlineSvg size={16} opacity={0.7} />
        </div>
        <div style={{ position: "absolute", top: "44%", right: "10%" }}>
          <StarOutlineSvg size={18} />
        </div>
        <div style={{ position: "absolute", top: "72%", right: "26%" }}>
          <FlowerOutlineSvg size={20} opacity={0.7} />
        </div>

        {/* Arrows from bubbles to feature targets */}
        {showArrows && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
            preserveAspectRatio="none"
          >
            {annotations.map((a) => {
              const bubble = BUBBLE_LAYOUT[a.position];
              const origin = ARROW_ORIGIN[a.position];
              const target = targets[a.target] || FALLBACK_TARGETS.body;
              const bubbleLeftPct = parseFloat(bubble.left) / 100;
              const bubbleTopPct = parseFloat(bubble.top) / 100;
              const bubbleW = width * 0.36;
              const bubbleH = height * 0.13;
              const fromX = bubbleLeftPct * width + origin.dx * bubbleW;
              const fromY = bubbleTopPct * height + origin.dy * bubbleH;
              const toX = target.x * width;
              const toY = target.y * height;
              return (
                <HandDrawnArrow
                  key={a.id}
                  from={{ x: fromX, y: fromY }}
                  to={{ x: toX, y: toY }}
                  color="#fffaf2"
                  opacity={0.85}
                  strokeWidth={2}
                />
              );
            })}
          </svg>
        )}

        {/* Bubbles */}
        {annotations.map((a) => (
          <BubbleBox key={a.id} annotation={a} width={width} height={height} />
        ))}
      </div>

      {/* Closing block */}
      <div
        style={{
          padding: "20px 24px 22px",
          background: "#fdf6e8",
          borderTop: "1px solid rgba(59,42,31,0.08)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -10, right: 24 }}>
          <HeartOutlineSvg size={18} />
        </div>
        <p
          className="jp-handwritten"
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: "#3b2a1f",
            whiteSpace: "pre-line",
            margin: 0,
          }}
        >
          {finalClosing.replace(/{petName}/g, petName)}
        </p>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "rgba(59,42,31,0.55)",
          }}
        >
          <span className="jp-handwritten">
            {petName}より　— {clinicName}
          </span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <HeartOutlineSvg size={12} />
            <span>{formatDateJa(new Date())}</span>
          </span>
        </div>
      </div>
    </div>
  );
});

function BubbleBox({
  annotation,
  width,
  height,
}: {
  annotation: Annotation;
  width: number;
  height: number;
}) {
  const layout = BUBBLE_LAYOUT[annotation.position];
  const bubbleW = width * 0.36;
  const bubbleH = height * 0.13;

  return (
    <div
      style={{
        position: "absolute",
        left: layout.left,
        top: layout.top,
        width: bubbleW,
        minHeight: bubbleH,
      }}
    >
      <CloudBubbleSvg width={bubbleW} height={bubbleH} />
      <div
        className="jp-handwritten"
        style={{
          position: "relative",
          padding: "12px 18px",
          color: "#3b2a1f",
          minHeight: bubbleH,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          <IconForType type={annotation.icon} />
          <span>{annotation.text}</span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(59,42,31,0.78)",
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {annotation.detail}
        </div>
      </div>
    </div>
  );
}

function IconForType({ type }: { type: IconType }) {
  const size = 16;
  switch (type) {
    case "heart":
      return <HeartOutlineSvg size={size} />;
    case "droplet":
      return <DropletSvg size={size} />;
    case "star":
      return <StarOutlineSvg size={size} />;
    case "sparkle":
      return <SparkleSvg size={size} />;
    case "flower":
      return <FlowerOutlineSvg size={size} />;
    case "smile":
      return <span style={{ fontSize: 13 }}>☺︎</span>;
    default:
      return <HeartOutlineSvg size={size} />;
  }
}

function formatDateJa(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
