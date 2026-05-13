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
  type BubbleSize,
  type FeatureTarget,
  type IconType,
} from "./types";

// Bubble position layout (normalized to canvas). Matches IMG_7948 reference.
// `wPct` / `hPct` are the bubble's box size as a fraction of canvas.
type BubbleLayout = { left: number; top: number; wPct: number; hPct: number };

const BUBBLE_LAYOUT: Record<BubblePosition, Record<BubbleSize, BubbleLayout>> = {
  tl: { sm: { left: 0.02, top: 0.07, wPct: 0.34, hPct: 0.13 }, lg: { left: 0.02, top: 0.06, wPct: 0.45, hPct: 0.18 } },
  tr: { sm: { left: 0.63, top: 0.07, wPct: 0.34, hPct: 0.13 }, lg: { left: 0.55, top: 0.06, wPct: 0.43, hPct: 0.18 } },
  ml: { sm: { left: 0.02, top: 0.3, wPct: 0.34, hPct: 0.14 }, lg: { left: 0.02, top: 0.3, wPct: 0.46, hPct: 0.2 } },
  mr: { sm: { left: 0.63, top: 0.36, wPct: 0.34, hPct: 0.17 }, lg: { left: 0.55, top: 0.36, wPct: 0.43, hPct: 0.22 } },
  bl: { sm: { left: 0.02, top: 0.55, wPct: 0.34, hPct: 0.13 }, lg: { left: 0.02, top: 0.55, wPct: 0.46, hPct: 0.18 } },
  br: { sm: { left: 0.6, top: 0.74, wPct: 0.37, hPct: 0.16 }, lg: { left: 0.5, top: 0.74, wPct: 0.48, hPct: 0.22 } },
  bc: { sm: { left: 0.38, top: 0.76, wPct: 0.4, hPct: 0.18 }, lg: { left: 0.36, top: 0.76, wPct: 0.6, hPct: 0.22 } },
};

// Where the arrow ORIGIN sits relative to each bubble (0..1 within bubble box).
const ARROW_ORIGIN: Record<BubblePosition, { dx: number; dy: number }> = {
  tl: { dx: 0.95, dy: 0.85 },
  tr: { dx: 0.05, dy: 0.85 },
  ml: { dx: 0.95, dy: 0.5 },
  mr: { dx: 0.05, dy: 0.5 },
  bl: { dx: 0.95, dy: 0.2 },
  br: { dx: 0.05, dy: 0.15 },
  bc: { dx: 0.5, dy: 0.1 },
};

// Per-icon accent color (the small dot/icon at the start of each bubble).
const ICON_COLOR: Record<IconType, string> = {
  heart: "#E08FA0",
  droplet: "#7BAFD4",
  star: "#D9B86A",
  sparkle: "#D9B86A",
  flower: "#E0AAB8",
  smile: "#3b2a1f",
};

export type ReportCardProps = {
  imageUrl: string;
  petName: string;
  clinicName: string;
  annotations: Annotation[];
  featureCoords?: Partial<Record<FeatureTarget, { x: number; y: number }>>;
  width?: number;
  showArrows?: boolean;
  logoUrl?: string;
};

export const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(function ReportCard(
  {
    imageUrl,
    petName,
    clinicName,
    annotations,
    featureCoords,
    width = 720,
    showArrows = true,
    logoUrl,
  },
  ref,
) {
  // Portrait 3:4 to match LINE share aesthetic and the reference image.
  const height = (width * 4) / 3;

  const targets = useMemo(
    () => ({ ...FALLBACK_TARGETS, ...(featureCoords || {}) }),
    [featureCoords],
  );

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
      {/* Title strip — paw prints + dashes flanking centered text */}
      <div
        style={{
          padding: "18px 24px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#fdf6e8",
        }}
      >
        <TitleDashSvg />
        <PawStampSvg size={18} color="#B89070" opacity={0.85} />
        <span
          className="jp-brush"
          style={{
            fontSize: 24,
            color: "#3b2a1f",
            fontWeight: 400,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          本日のご様子をお送りします
        </span>
        <PawStampSvg size={18} color="#B89070" opacity={0.85} />
        <TitleDashSvg />
      </div>

      {/* Canvas: AI illustration + all overlays */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          background: "#fdf6e8",
        }}
      >
        {/* AI-illustrated pet (or original photo as preview before generation).
            crossOrigin not set: data URLs are same-origin so html-to-image's
            clone-then-toPng pipeline works cleanly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={petName}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Soft torn-paper edge frame — subtle vignette to hide harsh photo edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            boxShadow: "inset 0 0 0 6px rgba(253,246,232,0.55), inset 0 0 24px rgba(253,246,232,0.4)",
            borderRadius: 0,
          }}
        />

        {/* Corner paw stamps — restrained, faded ink feel */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <PawStampSvg size={26} color="#B89070" opacity={0.5} />
        </div>
        <div style={{ position: "absolute", top: 12, right: 18 }}>
          <PawStampSvg size={22} color="#B89070" opacity={0.5} />
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 14 }}>
          <PawStampSvg size={22} color="#B89070" opacity={0.5} />
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 10 }}>
          <PawStampSvg size={28} color="#B89070" opacity={0.5} />
        </div>

        {/* Scattered tiny accents — hearts, stars, flowers */}
        <div style={{ position: "absolute", top: "23%", left: "32%" }}>
          <HeartOutlineSvg size={14} opacity={0.8} />
        </div>
        <div style={{ position: "absolute", top: "52%", left: "5%" }}>
          <HeartOutlineSvg size={12} opacity={0.7} />
        </div>
        <div style={{ position: "absolute", top: "44%", right: "8%" }}>
          <StarOutlineSvg size={14} opacity={0.8} />
        </div>
        <div style={{ position: "absolute", top: "68%", right: "30%" }}>
          <FlowerOutlineSvg size={16} opacity={0.7} />
        </div>
        <div style={{ position: "absolute", top: "30%", right: "32%" }}>
          <SparkleSvg size={12} opacity={0.7} />
        </div>

        {/* Arrows from bubbles to feature targets — solid dark brown ink */}
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
            {annotations
              .filter((a) => a.showArrow !== false)
              .map((a) => {
                const size: BubbleSize = a.size === "lg" ? "lg" : "sm";
                const layout = BUBBLE_LAYOUT[a.position][size];
                const origin = ARROW_ORIGIN[a.position];
                const target = targets[a.target] || FALLBACK_TARGETS.body;
                const bubbleW = width * layout.wPct;
                const bubbleH = height * layout.hPct;
                const fromX = layout.left * width + origin.dx * bubbleW;
                const fromY = layout.top * height + origin.dy * bubbleH;
                const toX = target.x * width;
                const toY = target.y * height;
                return (
                  <HandDrawnArrow
                    key={a.id}
                    from={{ x: fromX, y: fromY }}
                    to={{ x: toX, y: toY }}
                    color="#3b2a1f"
                    opacity={0.88}
                    strokeWidth={2}
                    dashed={false}
                  />
                );
              })}
          </svg>
        )}

        {/* Bubbles */}
        {annotations.map((a) => (
          <BubbleBox
            key={a.id}
            annotation={a}
            width={width}
            height={height}
          />
        ))}

        {/* Clinic logo (bottom-right corner — small, semi-transparent) */}
        {logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={clinicName}
            style={{
              position: "absolute",
              right: 14,
              bottom: 14,
              width: width * 0.11,
              height: width * 0.11,
              objectFit: "contain",
              opacity: 0.92,
              background: "rgba(255,250,242,0.78)",
              borderRadius: 10,
              padding: 5,
              boxShadow: "0 2px 6px rgba(59,42,31,0.14)",
            }}
          />
        )}
      </div>

      {/* Footer: clinic + date strip outside the canvas */}
      <div
        style={{
          padding: "10px 22px 14px",
          background: "#fdf6e8",
          borderTop: "1px solid rgba(59,42,31,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(59,42,31,0.55)",
        }}
      >
        <span className="jp-handwritten">{petName}より　— {clinicName}</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <HeartOutlineSvg size={10} opacity={0.7} />
          <span>{formatDateJa(new Date())}</span>
        </span>
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
  const size: BubbleSize = annotation.size === "lg" ? "lg" : "sm";
  const layout = BUBBLE_LAYOUT[annotation.position][size];
  const bubbleW = width * layout.wPct;
  const bubbleH = height * layout.hPct;
  const titleSize = size === "lg" ? 16 : 13.5;
  const detailSize = size === "lg" ? 13 : 11;

  return (
    <div
      style={{
        position: "absolute",
        left: `${layout.left * 100}%`,
        top: `${layout.top * 100}%`,
        width: bubbleW,
        minHeight: bubbleH,
      }}
    >
      <CloudBubbleSvg width={bubbleW} height={bubbleH} />
      <div
        className="jp-handwritten"
        style={{
          position: "relative",
          padding: "10px 16px 12px",
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
            alignItems: "flex-start",
            gap: 6,
            fontSize: titleSize,
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: "pre-line",
          }}
        >
          <IconForType type={annotation.icon} color={ICON_COLOR[annotation.icon]} />
          <span>{annotation.text}</span>
        </div>
        <div
          style={{
            fontSize: detailSize,
            color: "rgba(59,42,31,0.85)",
            marginTop: 3,
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {annotation.detail}
        </div>
      </div>
    </div>
  );
}

function IconForType({ type, color }: { type: IconType; color: string }) {
  const size = 14;
  switch (type) {
    case "heart":
      return <HeartOutlineSvg size={size} color={color} />;
    case "droplet":
      return <DropletSvg size={size} color={color} />;
    case "star":
      return <StarOutlineSvg size={size} color={color} />;
    case "sparkle":
      return <SparkleSvg size={size} color={color} />;
    case "flower":
      return <FlowerOutlineSvg size={size} color={color} />;
    case "smile":
      return <span style={{ fontSize: 12, color }}>☺︎</span>;
    default:
      return <HeartOutlineSvg size={size} color={color} />;
  }
}

function formatDateJa(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
