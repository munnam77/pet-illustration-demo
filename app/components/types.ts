export type Annotation = {
  id: string;
  text: string;
  detail: string;
  color: "pink" | "mint" | "accent";
  side: "left" | "right";
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
  { id: "a1", text: "食欲あります", detail: "ごはんをしっかり完食してくれました！", color: "pink", side: "left" },
  { id: "a2", text: "お水も飲めています", detail: "おトイレも問題ありません。", color: "mint", side: "right" },
  { id: "a3", text: "リラックスして過ごしています", detail: "落ち着いていて、安心しています。", color: "accent", side: "left" },
  { id: "a4", text: "元気にしています", detail: "お部屋の中で少し動いたり、おもちゃで遊んだりしています。", color: "mint", side: "right" },
  { id: "a5", text: "毛並みもきれいです", detail: "ふわふわで体調も安定しています。", color: "pink", side: "left" },
];
