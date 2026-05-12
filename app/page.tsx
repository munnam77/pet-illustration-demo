"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

type Annotation = {
  id: string;
  text: string;
  detail: string;
  color: "pink" | "mint" | "accent";
  side: "left" | "right";
};

const DEFAULT_ANNOTATIONS: Annotation[] = [
  { id: "a1", text: "食欲あります", detail: "ごはんをしっかり完食してくれました！", color: "pink", side: "left" },
  { id: "a2", text: "お水も飲めています", detail: "おトイレも問題ありません。", color: "mint", side: "right" },
  { id: "a3", text: "リラックスして過ごしています", detail: "落ち着いていて、安心しています。", color: "accent", side: "left" },
  { id: "a4", text: "元気にしています", detail: "お部屋の中で少し動いたり、おもちゃで遊んだりしています。", color: "mint", side: "right" },
  { id: "a5", text: "毛並みもきれいです", detail: "ふわふわで体調も安定しています。", color: "pink", side: "left" },
];

const STYLE_OPTIONS = [
  { id: "watercolor", label: "水彩イラスト", emoji: "🎨" },
  { id: "anime", label: "アニメ風", emoji: "✨" },
  { id: "picturebook", label: "絵本風", emoji: "📖" },
] as const;

const LOADING_MESSAGES = [
  "ペットのお写真を解析中…",
  "毛色・耳の形・体格を確認中…",
  "OpenAI gpt-image-2 で処理中…",
  "手書き風の吹き出しを配置中…",
  "肉球スタンプとハートを描き加えています…",
  "デコレーションフレームを仕上げ中…",
  "細部の調整中…",
  "もう少しで完成です…",
];

const ESTIMATED_SECONDS = 90;

export default function HomePage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof STYLE_OPTIONS)[number]["id"]>("watercolor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>(DEFAULT_ANNOTATIONS);
  const [petName, setPetName] = useState("チョコちゃん");
  const [clinicName, setClinicName] = useState("○○動物病院");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("10MB以下の画像をご利用ください。");
      return;
    }
    setError(null);
    setGeneratedUrl(null);
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onPickSample = useCallback(async () => {
    const res = await fetch("/sample-poodle.jpg");
    const blob = await res.blob();
    const file = new File([blob], "sample-poodle.jpg", { type: "image/jpeg" });
    handleFile(file);
  }, [handleFile]);

  const onGenerate = useCallback(async () => {
    if (!originalFile) return;
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    setLoadingMsgIdx(0);
    setElapsedSec(0);
    const startedAt = Date.now();
    const msgTick = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 12_000);
    const secTick = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    try {
      const fd = new FormData();
      fd.append("image", originalFile);
      fd.append("style", style);
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "生成に失敗しました。");
      setGeneratedUrl(data.imageDataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期せぬエラーが発生しました。");
    } finally {
      clearInterval(msgTick);
      clearInterval(secTick);
      setLoading(false);
    }
  }, [originalFile, style]);

  const onReset = useCallback(() => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setGeneratedUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>) =>
      setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [],
  );

  return (
    <div className="flex-1 w-full">
      <Hero />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* Upload area */}
        {!originalUrl && (
          <UploadCard
            fileInputRef={fileInputRef}
            onPick={(f) => handleFile(f)}
            onDrop={onDrop}
            onSample={onPickSample}
            error={error}
          />
        )}

        {/* Style + generate controls */}
        {originalUrl && !loading && (
          <div className="paper rounded-3xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm font-medium text-[#3b2a1f]/70">仕上げのスタイル：</span>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      style === s.id
                        ? "bg-[#3b2a1f] text-[#fffaf2] border-[#3b2a1f]"
                        : "bg-white text-[#3b2a1f] border-[#3b2a1f]/15 hover:border-[#3b2a1f]/40"
                    }`}
                  >
                    <span className="mr-1.5">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="sm:ml-auto flex gap-2">
                <button
                  onClick={onReset}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
                >
                  写真を変える
                </button>
                <button
                  onClick={onGenerate}
                  className="px-6 py-2 rounded-full text-sm font-semibold bg-[#e89a5a] hover:bg-[#d8884a] text-white shadow-sm"
                >
                  ✨ イラスト化する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result panel */}
        {originalUrl && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original */}
            <Card title="飼い主様から送られた写真" badge="Original">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#3b2a1f]/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="original" className="w-full h-full object-cover" />
              </div>
            </Card>

            {/* Generated */}
            <Card
              title="AIが生成したイラスト＋本日のご様子"
              badge={generatedUrl ? "Generated" : loading ? "Generating…" : "Pending"}
              accent
            >
              <ReportFrame
                petName={petName}
                clinicName={clinicName}
                imageUrl={generatedUrl}
                loading={loading}
                loadingMessage={LOADING_MESSAGES[loadingMsgIdx]}
                elapsedSec={elapsedSec}
                estimatedSec={ESTIMATED_SECONDS}
                annotations={annotations}
                fallbackUrl={originalUrl}
              />
            </Card>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Annotation editor */}
        {originalUrl && (
          <AnnotationEditor
            petName={petName}
            setPetName={setPetName}
            clinicName={clinicName}
            setClinicName={setClinicName}
            annotations={annotations}
            updateAnnotation={updateAnnotation}
          />
        )}

        {/* How it works */}
        {!originalUrl && <HowItWorks />}
      </section>

      <Footer />
    </div>
  );
}

/* ------------------------------- Components -------------------------------- */

function Hero() {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-full bg-[#e89a5a] flex items-center justify-center text-white text-lg">
          🐾
        </div>
        <span className="font-semibold tracking-wide text-[#3b2a1f]">わんにゃん肖像</span>
        <span className="ml-2 text-xs uppercase tracking-widest text-[#3b2a1f]/50">
          for veterinary clinics — prototype
        </span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-[#3b2a1f]">
        飼い主様の<span className="text-[#e89a5a]">スマホから</span>、
        <br className="hidden sm:inline" />
        ペットのご様子を<span className="handwritten text-[#d8884a]">そのまま</span>
        <span className="text-[#e89a5a]">手書き風</span>イラストに。
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[#3b2a1f]/70 max-w-2xl">
        動物病院の待合室から飼い主様のLINEへ。お預かりしているペットの今日のご様子を、
        毛色・耳の形・体格を保ったまま温かいイラストでお届けする
        <strong className="text-[#3b2a1f]"> 動物病院様向けAIサービス </strong>
        のプロトタイプです。
      </p>
    </header>
  );
}

function Card({
  title,
  badge,
  accent = false,
  children,
}: {
  title: string;
  badge?: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`paper rounded-3xl p-4 sm:p-5 ${accent ? "ring-1 ring-[#e89a5a]/30" : ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-[#3b2a1f]">{title}</h3>
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
      {children}
    </div>
  );
}

function UploadCard({
  fileInputRef,
  onPick,
  onDrop,
  onSample,
  error,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSample: () => void;
  error: string | null;
}) {
  return (
    <div className="paper rounded-3xl p-6 sm:p-10 mb-8">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#3b2a1f]/15 rounded-2xl p-8 sm:p-12 text-center dotgrid hover:border-[#e89a5a]/50 transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-5xl mb-3">📸</div>
        <p className="font-semibold text-[#3b2a1f]">ペットのお写真をアップロード</p>
        <p className="text-sm text-[#3b2a1f]/60 mt-1">
          ドラッグ＆ドロップ、またはクリックしてファイルを選択（JPG / PNG, 10MBまで）
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className="text-[#3b2a1f]/40">または</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSample();
            }}
            className="px-4 py-2 rounded-full bg-white border border-[#3b2a1f]/15 hover:border-[#3b2a1f]/40"
          >
            🐩 サンプル写真で試す
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function ReportFrame({
  petName,
  clinicName,
  imageUrl,
  loading,
  loadingMessage,
  elapsedSec,
  estimatedSec,
  annotations,
  fallbackUrl,
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
        {/* image (or shimmer while loading) */}
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
                経過 {elapsedSec}秒 / 目安 約{estimatedSec}秒（OpenAI gpt-image-2 を使用）
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
                上のボタンから <strong>イラスト化する</strong> を押すと、
                <br />
                ここにAIが生成した手書き風イラストが表示されます。
              </p>
            </div>
          </>
        ) : null}

        {/* Annotation overlays — only show when image is ready */}
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
            {petName}は本日も大きな変化はなく、安定して過ごしています。😊
            <br />
            引き続き、しっかりとケアしてまいりますので、ご安心ください。
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

function AnnotationEditor({
  petName,
  setPetName,
  clinicName,
  setClinicName,
  annotations,
  updateAnnotation,
}: {
  petName: string;
  setPetName: (v: string) => void;
  clinicName: string;
  setClinicName: (v: string) => void;
  annotations: Annotation[];
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
}) {
  return (
    <details className="paper rounded-3xl p-4 sm:p-6 mt-6 group">
      <summary className="cursor-pointer font-semibold text-[#3b2a1f] list-none flex items-center justify-between">
        <span>📝 ご報告内容を編集する（病院様側のコンソール）</span>
        <span className="text-xs text-[#3b2a1f]/50 group-open:rotate-180 transition">▾</span>
      </summary>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <LabeledInput label="ペットのお名前" value={petName} onChange={setPetName} />
        <LabeledInput label="病院名" value={clinicName} onChange={setClinicName} />
      </div>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {annotations.map((a) => (
          <div key={a.id} className="rounded-xl border border-[#3b2a1f]/10 p-3 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={a.text}
                onChange={(e) => updateAnnotation(a.id, { text: e.target.value })}
                className="font-semibold text-sm text-[#3b2a1f] bg-transparent flex-1 border-b border-dashed border-[#3b2a1f]/20 focus:outline-none focus:border-[#e89a5a]"
              />
              <ColorPicker
                color={a.color}
                onChange={(c) => updateAnnotation(a.id, { color: c })}
              />
            </div>
            <textarea
              value={a.detail}
              onChange={(e) => updateAnnotation(a.id, { detail: e.target.value })}
              className="w-full text-xs text-[#3b2a1f]/80 bg-transparent resize-none focus:outline-none"
              rows={2}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#3b2a1f]/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-[#3b2a1f]/10 focus:outline-none focus:border-[#e89a5a] text-sm"
      />
    </label>
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: Annotation["color"];
  onChange: (c: Annotation["color"]) => void;
}) {
  const options: { id: Annotation["color"]; className: string }[] = [
    { id: "pink", className: "bg-[#f5b7c5]" },
    { id: "mint", className: "bg-[#b5dac1]" },
    { id: "accent", className: "bg-[#f7d4b0]" },
  ];
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`w-4 h-4 rounded-full ${o.className} ring-2 ring-offset-1 ${
            color === o.id ? "ring-[#3b2a1f]/60" : "ring-transparent"
          }`}
          aria-label={o.id}
        />
      ))}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: "📱",
      title: "飼い主様",
      body: "待合室や来院前にスマホで撮影したペットの写真を、病院の LINE 公式アカウントに送信。",
    },
    {
      icon: "🤖",
      title: "AI 画像生成",
      body: "OpenAI gpt-image-1 が、毛色・耳の形・体格などの個体特徴を保持したまま手書き風イラストへ変換。",
    },
    {
      icon: "💌",
      title: "病院 → 飼い主様",
      body: "本日のご様子（食欲・水分・元気度など）を添えて LINE で自動返信。診察前の信頼形成に。",
    },
  ];
  return (
    <div className="paper rounded-3xl p-6 sm:p-8 mt-8">
      <h2 className="font-semibold text-lg text-[#3b2a1f] mb-4">🪄 仕組み</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-2xl bg-white border border-[#3b2a1f]/10 p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <h3 className="font-semibold text-sm text-[#3b2a1f]">{i + 1}. {s.title}</h3>
            <p className="mt-1.5 text-xs text-[#3b2a1f]/70 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#3b2a1f]/10 mt-12 py-8 text-center text-xs text-[#3b2a1f]/50">
      <p>
        Prototype built by <a className="underline" href="https://cognitiveappdev.com">Cognitive AppDev</a> — Powered by OpenAI gpt-image-1
      </p>
      <p className="mt-1">© 2026 Cognitive AppDev — for evaluation only</p>
    </footer>
  );
}
