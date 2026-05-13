"use client";

import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import { Card } from "./Card";
import { ReportCard } from "./ReportCard";
import {
  DEFAULT_ANNOTATIONS,
  FALLBACK_TARGETS,
  type Annotation,
  type FeatureTarget,
} from "./types";

export function OwnerTab({
  petName,
  setPetName,
  clinicName,
  setClinicName,
  annotations,
  setAnnotations,
  logoFile: _logoFile,
}: {
  petName: string;
  setPetName: (v: string) => void;
  clinicName: string;
  setClinicName: (v: string) => void;
  annotations: Annotation[];
  setAnnotations: (a: Annotation[]) => void;
  logoFile: File | null;
}) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [screening, setScreening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureCoords, setFeatureCoords] = useState<
    Partial<Record<FeatureTarget, { x: number; y: number }>> | undefined
  >(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>) =>
      setAnnotations(annotations.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [annotations, setAnnotations],
  );

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
    setOriginalFile(file);
    setFeatureCoords(undefined);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    // Pet detection (gentle — failures fall back silently)
    setScreening(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/screen", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data?.allowed === false) {
        setError(data.reason_ja || "ペット以外の写真が検出されました。");
        setOriginalUrl(null);
        setOriginalFile(null);
        return;
      }
    } catch {
      // ignore — screening is best-effort
    } finally {
      setScreening(false);
    }

    // Feature-point detection for arrow placement
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.features)) {
        const coords: Partial<Record<FeatureTarget, { x: number; y: number }>> = {};
        for (const f of data.features) {
          if (f.part && typeof f.x === "number" && typeof f.y === "number") {
            coords[f.part as FeatureTarget] = { x: f.x, y: f.y };
          }
        }
        setFeatureCoords(coords);
      }
    } catch {
      // fall back to default coords
    } finally {
      setAnalyzing(false);
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

  const onReset = useCallback(() => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setFeatureCoords(undefined);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onDownload = useCallback(async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      // Pre-load fonts inside html-to-image's offscreen render.
      // html-to-image automatically embeds web fonts referenced via CSS variables.
      await document.fonts.ready;
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fdf6e8",
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

  return (
    <div className="space-y-6">
      {!originalUrl && (
        <UploadCard
          fileInputRef={fileInputRef}
          onPick={handleFile}
          onDrop={onDrop}
          onSample={onPickSample}
          error={error}
        />
      )}

      {originalUrl && (screening || analyzing) && (
        <Card>
          <p className="text-sm text-[#3b2a1f]/70 text-center py-2">
            {screening
              ? "🔍 写真の確認中…"
              : "🐾 ペットの特徴を解析中…（矢印の指し位置を最適化）"}
          </p>
        </Card>
      )}

      {originalUrl && !screening && (
        <>
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm text-[#3b2a1f]/70">
                {analyzing
                  ? "📍 ペット特徴の解析中…"
                  : "✅ ご様子レポートが完成しました。右下からダウンロードできます。"}
              </span>
              <div className="sm:ml-auto flex gap-2 flex-wrap">
                <button
                  onClick={onReset}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
                >
                  別の写真にする
                </button>
                <button
                  onClick={onDownload}
                  disabled={downloading || analyzing}
                  className={`px-6 py-2 rounded-full text-sm font-semibold text-white shadow-sm transition ${
                    downloading || analyzing
                      ? "bg-[#3b2a1f]/30 cursor-not-allowed"
                      : "bg-[#e89a5a] hover:bg-[#d8884a]"
                  }`}
                >
                  {downloading ? "保存中…" : "⬇ PNG画像をダウンロード"}
                </button>
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <div className="overflow-x-auto max-w-full">
              <ReportCard
                ref={reportRef}
                imageUrl={originalUrl}
                petName={petName}
                clinicName={clinicName}
                annotations={annotations}
                featureCoords={featureCoords || FALLBACK_TARGETS}
                width={720}
              />
            </div>
          </div>

          <AnnotationEditor
            petName={petName}
            setPetName={setPetName}
            clinicName={clinicName}
            setClinicName={setClinicName}
            annotations={annotations}
            updateAnnotation={updateAnnotation}
          />
        </>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!originalUrl && <HowItWorks />}
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
      body: "病院のLINE公式アカウントに友だち追加 →「ペット画像を作る」メニューからLIFFが起動 → 写真をアップロード。",
    },
    {
      icon: "🐾",
      title: "ペット特徴の自動解析",
      body: "ペットの目・口・体・足など各部位の位置を解析し、レポートの矢印が自動的にその部位を指します。",
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
