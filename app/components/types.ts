export type BubblePosition = "tl" | "tr" | "ml" | "mr" | "bl" | "br";
export type IconType = "heart" | "droplet" | "star" | "sparkle" | "flower" | "smile";
export type FeatureTarget = "face" | "eyes" | "mouth" | "body" | "paw" | "fur" | "ear" | "tail";

export type Annotation = {
  id: string;
  position: BubblePosition;
  icon: IconType;
  text: string;
  detail: string;
  target: FeatureTarget;
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

export const DEFAULT_ANNOTATIONS: Annotation[] = [
  {
    id: "a1",
    position: "tl",
    icon: "heart",
    text: "食欲あります",
    detail: "ごはんをしっかり完食してくれました！",
    target: "mouth",
  },
  {
    id: "a2",
    position: "tr",
    icon: "droplet",
    text: "お水も飲めています",
    detail: "おトイレも問題ありません。",
    target: "mouth",
  },
  {
    id: "a3",
    position: "ml",
    icon: "star",
    text: "リラックスして過ごしています",
    detail: "落ち着いていて、安心しています。",
    target: "body",
  },
  {
    id: "a4",
    position: "mr",
    icon: "sparkle",
    text: "元気にしています",
    detail: "お部屋の中で少し動いたり、おもちゃで遊んだりしています。",
    target: "paw",
  },
  {
    id: "a5",
    position: "bl",
    icon: "heart",
    text: "毛並みもきれいです",
    detail: "ふわふわで体調も安定しています。",
    target: "fur",
  },
];

// Maps each feature target to a normalized (x, y) coordinate on the photo.
// Used when vision-based detection isn't available (instant render).
export const FALLBACK_TARGETS: Record<FeatureTarget, { x: number; y: number }> = {
  face: { x: 0.5, y: 0.32 },
  eyes: { x: 0.52, y: 0.34 },
  mouth: { x: 0.5, y: 0.42 },
  body: { x: 0.5, y: 0.6 },
  paw: { x: 0.42, y: 0.78 },
  fur: { x: 0.5, y: 0.55 },
  ear: { x: 0.4, y: 0.25 },
  tail: { x: 0.65, y: 0.65 },
};
