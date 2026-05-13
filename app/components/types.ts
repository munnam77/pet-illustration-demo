export type BubblePosition = "tl" | "tr" | "ml" | "mr" | "bl" | "br" | "bc";
export type BubbleSize = "sm" | "lg";
export type IconType = "heart" | "droplet" | "star" | "sparkle" | "flower" | "smile";
export type FeatureTarget = "face" | "eyes" | "mouth" | "body" | "paw" | "fur" | "ear" | "tail";

export type Annotation = {
  id: string;
  position: BubblePosition;
  size?: BubbleSize;
  icon: IconType;
  text: string;
  detail: string;
  target: FeatureTarget;
  showArrow?: boolean;
};

export type StyleId = "watercolor" | "anime" | "picturebook" | "crayon" | "simple";

export type StyleOption = {
  id: StyleId;
  label: string;
  emoji: string;
  description: string;
};

export const STYLE_OPTIONS: StyleOption[] = [
  { id: "watercolor", label: "水彩イラスト", emoji: "🎨", description: "温かい水彩画タッチ。" },
  { id: "anime", label: "アニメ風", emoji: "✨", description: "華やかなアニメ風ステッカー。" },
  { id: "picturebook", label: "絵本風", emoji: "📖", description: "子供向け絵本の挿絵風。" },
  { id: "crayon", label: "クレヨン画風", emoji: "🖍️", description: "幼稚園クレヨンタッチ。" },
  { id: "simple", label: "シンプル線画", emoji: "✏️", description: "ミニマル・洗練。" },
];

// 7 annotations matching IMG_7948 reference exactly: 5 small status bubbles
// + 1 large closing reassurance bubble (bottom-center) + 1 tiny bottom-left
// "ご心配をおかけしますが" bubble. Bubbles 1-5 have arrows to body parts.
export const DEFAULT_ANNOTATIONS: Annotation[] = [
  {
    id: "a1",
    position: "tl",
    icon: "heart",
    text: "食欲あります",
    detail: "ごはんをしっかり完食\nしてくれました！",
    target: "mouth",
    showArrow: true,
  },
  {
    id: "a2",
    position: "tr",
    icon: "droplet",
    text: "お水も飲めています",
    detail: "おトイレも\n問題ありません。",
    target: "mouth",
    showArrow: true,
  },
  {
    id: "a3",
    position: "ml",
    icon: "star",
    text: "リラックスして\n過ごしています",
    detail: "落ち着いていて、\n安心しています。",
    target: "body",
    showArrow: true,
  },
  {
    id: "a4",
    position: "mr",
    icon: "sparkle",
    text: "元気にしています",
    detail: "お部屋の中で\n少し動いたり、\nおもちゃで遊んだり\nしています。",
    target: "paw",
    showArrow: true,
  },
  {
    id: "a5",
    position: "bl",
    icon: "heart",
    text: "毛並みもきれいです",
    detail: "ふわふわで体調も\n安定しています。",
    target: "fur",
    showArrow: true,
  },
  {
    id: "a6",
    position: "bc",
    size: "lg",
    icon: "smile",
    text: "本日も大きな変化はなく、\n安定して過ごしています。",
    detail: "引き続き、しっかりと\nケアしてまいりますので\nご安心ください。",
    target: "body",
    showArrow: false,
  },
];

// Maps each feature target to a normalized (x, y) coordinate on the photo.
// Used when vision-based detection isn't available (instant render).
export const FALLBACK_TARGETS: Record<FeatureTarget, { x: number; y: number }> = {
  face: { x: 0.5, y: 0.32 },
  eyes: { x: 0.52, y: 0.34 },
  mouth: { x: 0.5, y: 0.4 },
  body: { x: 0.5, y: 0.55 },
  paw: { x: 0.42, y: 0.7 },
  fur: { x: 0.48, y: 0.5 },
  ear: { x: 0.4, y: 0.25 },
  tail: { x: 0.65, y: 0.6 },
};
