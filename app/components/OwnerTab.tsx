"use client";

import { getFontEmbedCSS, toPng } from "html-to-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./Card";
import { ReportCard } from "./ReportCard";
import {
  DEFAULT_ANNOTATIONS,
  FALLBACK_TARGETS,
  STYLE_OPTIONS,
  type Annotation,
  type FeatureTarget,
  type StyleId,
} from "./types";

const LOADING_MESSAGES = [
  "ペットのお写真を解析中…",
  "毛色・耳の形・体格を確認中…",
  "個体の特徴を学習中…",
  "手書き風タッチに変換中…",
  "デコレーションを描き加えています…",
  "病院ロゴ・お名前を配置中…",
  "細部の調整中…",
  "もう少しで完成です…",
];

const ESTIMATED_SECONDS = 90;

export function OwnerTab({
  petName,
  setPetName,
  clinicName,
  setClinicName,
  annotations,
  setAnnotations,
  logoFile,
}: {
  petName: string;
  setPetName: (v: string) => void;
  clinicName: string;
  setClinicName: (v: string) => void;
  annotations: Annotation[];
  setAnnotations: (a: Annotation[]) => void;
  logoFile: File | null;
}) {
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [illustratedDataUrl, setIllustratedDataUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleId>("watercolor");
  const [screening, setScreening] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [featureCoords, setFeatureCoords] = useState<
    Partial<Record<FeatureTarget, { x: number; y: number }>> | undefined
  >(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Logo File → object URL for ReportCard
  const logoUrl = useMemo(() => {
    if (!logoFile) return undefined;
    return URL.createObjectURL(logoFile);
  }, [logoFile]);
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>) =>
      setAnnotations(annotations.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [annotations, setAnnotations],
  );

  // Convert File → base64 data URL (more reliable than Blob URL for html-to-image).
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("10MB以下の画像をご利用ください。");
      return;
    }
    setError(null);
    setIllustratedDataUrl(null);
    setFeatureCoords(undefined);
    setOriginalFile(file);

    const dataUrl = await fileToDataUrl(file);
    setOriginalDataUrl(dataUrl);

    setScreening(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/screen", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data?.allowed === false) {
        setError(data.reason_ja || "ペット以外の写真が検出されました。");
        setOriginalDataUrl(null);
        setOriginalFile(null);
        return;
      }
    } catch {
      // ignore — screening is best-effort
    } finally {
      setScreening(false);
    }
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
    const res = await fetch("/sample-cat.jpg");
    const blob = await res.blob();
    const file = new File([blob], "sample-cat.jpg", { type: "image/jpeg" });
    handleFile(file);
  }, [handleFile]);

  const onGenerate = useCallback(async () => {
    if (!originalFile) return;
    setGenerating(true);
    setError(null);
    setIllustratedDataUrl(null);
    setLoadingMsgIdx(0);
    setElapsedSec(0);

    const startedAt = Date.now();
    const msgTick = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      10_000,
    );
    const secTick = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );

    try {
      // Run feature detection and image generation in parallel.
      const analyzeFd = new FormData();
      analyzeFd.append("image", originalFile);
      const analyzePromise = fetch("/api/analyze", { method: "POST", body: analyzeFd })
        .then((r) => r.json())
        .catch(() => null);

      const genFd = new FormData();
      genFd.append("image", originalFile);
      genFd.append("style", style);
      const genRes = await fetch("/api/generate", { method: "POST", body: genFd });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData?.error || "生成に失敗しました。");
      setIllustratedDataUrl(genData.imageDataUrl);

      const analyzeData = await analyzePromise;
      if (analyzeData && Array.isArray(analyzeData.features)) {
        const coords: Partial<Record<FeatureTarget, { x: number; y: number }>> = {};
        for (const f of analyzeData.features) {
          if (f.part && typeof f.x === "number" && typeof f.y === "number") {
            coords[f.part as FeatureTarget] = { x: f.x, y: f.y };
          }
        }
        setFeatureCoords(coords);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期せぬエラーが発生しました。");
    } finally {
      clearInterval(msgTick);
      clearInterval(secTick);
      setGenerating(false);
    }
  }, [originalFile, style]);

  const onReset = useCallback(() => {
    setOriginalFile(null);
    setOriginalDataUrl(null);
    setIllustratedDataUrl(null);
    setFeatureCoords(undefined);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onDownload = useCallback(async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    setError(null);
    try {
      await document.fonts.ready;
      const fontEmbedCSS = await getFontEmbedCSS(reportRef.current);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fdf6e8",
        fontEmbedCSS,
        skipFonts: false,
        style: { transform: "none" },
      });
      const a = document.createElement("a");
      a.download = `${petName || "pet"}_${formatDate(new Date())}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました。");
    } finally {
      setDownloading(false);
    }
  }, [petName]);

  // Decide which image to use as the report background:
  // 1. AI-illustrated (preferred — matches client's "手書き風イラスト変換" requirement)
  // 2. Otherwise fall back to the original photo (preview before generation)
  const reportImage = illustratedDataUrl || originalDataUrl;

  return (
    <div className="space-y-6">
      {!originalDataUrl && (
        <UploadCard
          fileInputRef={fileInputRef}
          onPick={handleFile}
          onDrop={onDrop}
          onSample={onPickSample}
          error={error}
        />
      )}

      {screening && (
        <Card>
          <p className="text-sm text-[#3b2a1f]/70 text-center py-2">
            🔍 写真の確認中…
          </p>
        </Card>
      )}

      {originalDataUrl && !screening && !generating && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm font-medium text-[#3b2a1f]/70">仕上げのスタイル：</span>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition ${
                    style === s.id
                      ? "bg-[#3b2a1f] text-[#fffaf2] border-[#3b2a1f]"
                      : "bg-white text-[#3b2a1f] border-[#3b2a1f]/15 hover:border-[#3b2a1f]/40"
                  }`}
                  title={s.description}
                >
                  <span className="mr-1.5">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto flex gap-2 flex-wrap">
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-full text-sm font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
              >
                別の写真にする
              </button>
              {illustratedDataUrl ? (
                <button
                  onClick={onDownload}
                  disabled={downloading}
                  className={`px-6 py-2 rounded-full text-sm font-semibold text-white shadow-sm transition ${
                    downloading
                      ? "bg-[#3b2a1f]/30 cursor-not-allowed"
                      : "bg-[#e89a5a] hover:bg-[#d8884a]"
                  }`}
                >
                  {downloading ? "保存中…" : "⬇ PNG画像をダウンロード"}
                </button>
              ) : (
                <button
                  onClick={onGenerate}
                  className="px-6 py-2 rounded-full text-sm font-semibold bg-[#e89a5a] hover:bg-[#d8884a] text-white shadow-sm"
                >
                  ✨ イラスト化する
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {generating && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="text-sm font-medium text-[#3b2a1f]/85 text-center">
              ✨ {LOADING_MESSAGES[loadingMsgIdx]}
            </div>
            <div className="w-full max-w-[420px]">
              <div className="h-1.5 rounded-full bg-[#3b2a1f]/10 overflow-hidden">
                <div
                  className="h-full bg-[#e89a5a] transition-all duration-1000 ease-linear"
                  style={{
                    width: `${Math.min(95, Math.round((elapsedSec / ESTIMATED_SECONDS) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-[#3b2a1f]/55 mt-1.5 text-center">
                経過 {elapsedSec}秒 / 目安 約{ESTIMATED_SECONDS}秒
              </p>
            </div>
          </div>
        </Card>
      )}

      {reportImage && !screening && (
        <div className="flex justify-center">
          <div className="overflow-x-auto max-w-full">
            <ReportCard
              ref={reportRef}
              imageUrl={reportImage}
              petName={petName}
              clinicName={clinicName}
              annotations={annotations}
              featureCoords={featureCoords || FALLBACK_TARGETS}
              logoUrl={logoUrl}
              width={720}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {originalDataUrl && !screening && (
        <AnnotationEditor
          petName={petName}
          setPetName={setPetName}
          clinicName={clinicName}
          setClinicName={setClinicName}
          annotations={annotations}
          updateAnnotation={updateAnnotation}
        />
      )}

      {!originalDataUrl && <HowItWorks />}
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
    <div className="paper rounded-3xl p-6 sm:p-10">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#3b2a1f]/15 rounded-2xl p-8 sm:p-12 text-center dotgrid hover:border-[#e89a5a]/50 transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-5xl mb-3">📸</div>
        <p className="font-semibold text-[#3b2a1f]">ペットのお写真をアップロード</p>
        <p className="text-sm text-[#3b2a1f]/60 mt-1">
          ドラッグ＆ドロップ、またはクリック（JPG / PNG, 10MBまで）
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
            🐈 サンプル写真で試す
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
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
    <details className="paper rounded-3xl p-4 sm:p-6 group">
      <summary className="cursor-pointer font-semibold text-[#3b2a1f] list-none flex items-center justify-between">
        <span>📝 ご報告内容を編集（病院様コメント編集機能）</span>
        <span className="text-xs text-[#3b2a1f]/50 group-open:rotate-180 transition">▾</span>
      </summary>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <LabeledInput label="ペットのお名前" value={petName} onChange={setPetName} />
        <LabeledInput label="病院名" value={clinicName} onChange={setClinicName} />
      </div>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {annotations.map((a) => (
          <div key={a.id} className="rounded-xl border border-[#3b2a1f]/10 p-3 bg-white">
            <input
              value={a.text}
              onChange={(e) => updateAnnotation(a.id, { text: e.target.value })}
              className="font-semibold text-sm text-[#3b2a1f] bg-transparent w-full border-b border-dashed border-[#3b2a1f]/20 focus:outline-none focus:border-[#e89a5a] pb-1"
            />
            <textarea
              value={a.detail}
              onChange={(e) => updateAnnotation(a.id, { detail: e.target.value })}
              className="w-full text-xs text-[#3b2a1f]/80 bg-transparent resize-none focus:outline-none mt-2"
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

function HowItWorks() {
  const steps = [
    {
      icon: "📱",
      title: "飼い主様（LINE / LIFF）",
      body: "病院のLINE公式アカウントに友だち追加 →「ペット画像を作る」メニューからLIFFが起動 → 写真と画風を選択。",
    },
    {
      icon: "🎨",
      title: "AI による手書き風イラスト化",
      body: "ペットの個体特徴（毛色・体格・耳の形・表情）を保ったまま、手書き風イラストへ変換。仕上げに矢印・吹き出し・装飾を合成。",
    },
    {
      icon: "💌",
      title: "完成レポートをLINEで返信",
      body: "本日のご様子レポート（手書き風日本語＋矢印付き）をPNG画像で配信。保存・転送がそのまま可能。",
    },
  ];
  return (
    <div className="paper rounded-3xl p-6 sm:p-8">
      <h2 className="font-semibold text-lg text-[#3b2a1f] mb-4">🪄 サービス全体の仕組み</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-2xl bg-white border border-[#3b2a1f]/10 p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <h3 className="font-semibold text-sm text-[#3b2a1f]">
              {i + 1}. {s.title}
            </h3>
            <p className="mt-1.5 text-xs text-[#3b2a1f]/70 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
