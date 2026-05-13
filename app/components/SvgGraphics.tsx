"use client";

// SVG hand-drawn graphics — replaces gpt-image-2 decorations.
// All paths are hand-tuned to look like real pen marks: slight wobble in stroke,
// open outlines (not filled), faded ink colors.

export function PawStampSvg({
  size = 36,
  color = "#B89070",
  opacity = 0.75,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ opacity }} aria-hidden>
      <g fill={color}>
        <ellipse cx="32" cy="40" rx="13" ry="11" />
        <ellipse cx="14" cy="22" rx="5.5" ry="7" />
        <ellipse cx="50" cy="22" rx="5.5" ry="7" />
        <ellipse cx="22" cy="11" rx="4.5" ry="6" />
        <ellipse cx="42" cy="11" rx="4.5" ry="6" />
      </g>
    </svg>
  );
}

export function HeartOutlineSvg({
  size = 22,
  color = "#E08FA0",
  opacity = 0.85,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ opacity }} aria-hidden>
      <path
        d="M16 27 C 6 19, 3 12, 9 8 C 13 5, 16 8, 16 11 C 16 8, 19 5, 23 8 C 29 12, 26 19, 16 27 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarOutlineSvg({
  size = 22,
  color = "#D9B86A",
  opacity = 0.85,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ opacity }} aria-hidden>
      <path
        d="M16 4 L19.5 12.5 L28.5 13 L21.5 19 L24 27.5 L16 22.5 L8 27.5 L10.5 19 L3.5 13 L12.5 12.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlowerOutlineSvg({
  size = 22,
  color = "#E0AAB8",
  opacity = 0.85,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ opacity }} aria-hidden>
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <ellipse cx="16" cy="8" rx="3" ry="5" />
        <ellipse cx="24" cy="16" rx="5" ry="3" />
        <ellipse cx="16" cy="24" rx="3" ry="5" />
        <ellipse cx="8" cy="16" rx="5" ry="3" />
        <circle cx="16" cy="16" r="2.2" fill={color} />
      </g>
    </svg>
  );
}

export function DropletSvg({
  size = 18,
  color = "#7BAFD4",
  opacity = 0.85,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ opacity }} aria-hidden>
      <path
        d="M12 3 C 12 3, 5 12, 5 16 C 5 20, 8 22, 12 22 C 16 22, 19 20, 19 16 C 19 12, 12 3, 12 3 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkleSvg({
  size = 18,
  color = "#D9B86A",
  opacity = 0.9,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ opacity }} aria-hidden>
      <g fill={color}>
        <path d="M12 2 L13 10 L21 11 L13 12 L12 21 L11 12 L3 11 L11 10 Z" />
      </g>
    </svg>
  );
}

// Cloud-shaped speech bubble — scalloped edges like reference image.
// Outline only, semi-transparent fill so the photo shows through.
export function CloudBubbleSvg({
  width = 280,
  height = 110,
  fill = "rgba(255, 252, 245, 0.78)",
  stroke = "#3b2a1f",
  strokeWidth = 1.4,
}: {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  // A cloud with 14 scalloped bumps — looks hand-drawn.
  // Path generated to fit a 280x110 viewBox with the bumps along the perimeter.
  return (
    <svg
      viewBox="0 0 280 110"
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <path
        d="M 20 30
           C 18 18, 32 8, 44 14
           C 48 6, 64 4, 72 12
           C 80 4, 96 6, 100 14
           C 110 4, 128 6, 134 16
           C 144 4, 164 6, 168 18
           C 180 6, 200 8, 204 20
           C 218 8, 240 10, 244 24
           C 262 18, 274 32, 264 46
           C 276 54, 270 74, 256 78
           C 264 92, 248 106, 232 100
           C 228 110, 208 110, 200 102
           C 188 110, 168 108, 162 98
           C 152 108, 132 106, 128 96
           C 116 108, 96 106, 92 96
           C 80 106, 60 104, 56 94
           C 40 102, 22 96, 22 80
           C 8 78, 4 60, 14 52
           C 4 42, 8 28, 20 30 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Hand-drawn arrow with curved path + arrowhead.
// From a START point to END point, with optional curve direction.
export function HandDrawnArrow({
  from,
  to,
  curve = "auto",
  color = "#3b2a1f",
  strokeWidth = 1.8,
  opacity = 0.75,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curve?: "auto" | "left" | "right";
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const curveAmount = Math.min(40, dist * 0.25);
  const perpDir = curve === "left" ? -1 : curve === "right" ? 1 : (dx * dy > 0 ? -1 : 1);
  const ctrlX = (from.x + to.x) / 2 + (-dy / dist) * curveAmount * perpDir;
  const ctrlY = (from.y + to.y) / 2 + (dx / dist) * curveAmount * perpDir;

  // Arrowhead: compute angle of tangent at end (toward end from control point)
  const angle = Math.atan2(to.y - ctrlY, to.x - ctrlX);
  const headLen = 9;
  const headAngle = Math.PI / 7;
  const h1x = to.x - headLen * Math.cos(angle - headAngle);
  const h1y = to.y - headLen * Math.sin(angle - headAngle);
  const h2x = to.x - headLen * Math.cos(angle + headAngle);
  const h2y = to.y - headLen * Math.sin(angle + headAngle);

  return (
    <g style={{ opacity }}>
      <path
        d={`M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <path
        d={`M ${to.x} ${to.y} L ${h1x} ${h1y} M ${to.x} ${to.y} L ${h2x} ${h2y}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </g>
  );
}

// Decorative em-dash line for the title strip.
export function TitleDashSvg({
  color = "#D8884A",
  opacity = 0.65,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 60 6" width="60" height="6" style={{ opacity }} aria-hidden>
      <line x1="0" y1="3" x2="60" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
