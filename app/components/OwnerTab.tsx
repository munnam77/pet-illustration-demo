"use client";

import { getFontEmbedCSS, toPng } from "html-to-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  "ペットのお写真を解析しています…",
  "毛色・耳の形・体格を確認しています…",
  "個体の特徴を保持しながら描き起こしています…",
  "手書き風タッチで仕上げています…",
  "デコレーションを描き加えています…",
  "病院ロゴ・お名前を配置しています…",
  "細部を調整しています…",
  "まもなく完成します…",
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
        setError(data.reason_ja || "ペット以外のお写真が検出されました。");
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

  const reportImage = illustratedDataUrl || originalDataUrl;
  const status: "idle" | "screening" | "ready" | "generating" | "done" =
    !originalDataUrl ? "idle"
    : screening ? "screening"
    : generating ? "generating"
    : illustratedDataUrl ? "done"
    : "ready";

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
      {/* Left: LINE LIFF phone-frame */}
      <div className="lg:sticky lg:top-4">
        <PhoneFrame clinicName={clinicName}>
          {status === "idle" && (
            <UploadCard
              fileInputRef={fileInputRef}
              onPick={handleFile}
              onDrop={onDrop}
              onSample={onPickSample}
            />
          )}

          {status === "screening" && (
            <LiffMessage>
              <SmallSpinner /> お写真を確認しています…
            </LiffMessage>
          )}

          {status === "ready" && originalDataUrl && (
            <ReadyCard
              originalDataUrl={originalDataUrl}
              style={style}
              setStyle={setStyle}
              onGenerate={onGenerate}
              onReset={onReset}
            />
          )}

          {status === "generating" && (
            <GeneratingCard
              loadingMsg={LOADING_MESSAGES[loadingMsgIdx]}
              elapsedSec={elapsedSec}
            />
          )}

          {status === "done" && illustratedDataUrl && (
            <DoneCard
              petName={petName}
              clinicName={clinicName}
              onReset={onReset}
              onDownload={onDownload}
              downloading={downloading}
            />
          )}

          {error && (
            <p className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </PhoneFrame>
      </div>

      {/* Right: report card preview + annotation editor */}
      <div className="space-y-5">
        {reportImage ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#3b2a1f]">
                生成結果プレビュー（LINEで返信される画像）
              </h3>
              <span className="text-[10px] text-[#3b2a1f]/50">
                {status === "done" ? "✓ 生成完了" : status === "generating" ? "● 生成中" : "下書き"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <ReportCard
                ref={reportRef}
                imageUrl={reportImage}
                petName={petName}
                clinicName={clinicName}
                annotations={annotations}
                featureCoords={featureCoords || FALLBACK_TARGETS}
                logoUrl={logoUrl}
                width={680}
              />
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
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}

function PhoneFrame({
  children,
  clinicName,
}: {
  children: React.ReactNode;
  clinicName: string;
}) {
  return (
    <div className="mx-auto" style={{ maxWidth: 380 }}>
      <div
        className="rounded-[36px] border border-[#3b2a1f]/15 bg-[#fdfaf3] shadow-[0_30px_60px_-30px_rgba(59,42,31,0.35)] overflow-hidden"
      >
        {/* status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] text-[#3b2a1f]/60 font-mono tabular-nums">
          <span>9:41</span>
          <span className="h-1 w-16 rounded-full bg-[#3b2a1f]/10" />
          <span>•••</span>
        </div>
        {/* LINE chat header */}
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#3b2a1f]/8 bg-[#06c755]/8">
          <div className="h-7 w-7 rounded-full bg-[#06c755] text-white flex items-center justify-center text-[11px] font-bold">
            病
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold text-[#3b2a1f]">{clinicName}</div>
            <div className="text-[10px] text-[#3b2a1f]/55">LINE 公式アカウント</div>
          </div>
          <span className="ml-auto text-[10px] text-[#3b2a1f]/40">LIFF</span>
        </div>
        <div className="p-4 min-h-[480px] bg-[#fdfaf3]">{children}</div>
        {/* bottom chat bar */}
        <div className="px-3 py-2 border-t border-[#3b2a1f]/8 bg-white/60 flex items-center gap-2 text-[#3b2a1f]/40">
          <span className="text-base">＋</span>
          <div className="flex-1 h-7 rounded-full bg-[#3b2a1f]/5" />
          <span className="text-base">🎙</span>
        </div>
      </div>
      <p className="text-center text-[10px] text-[#3b2a1f]/45 mt-2">
        ↑ LINE LIFF 画面プレビュー（実機と同等の体験）
      </p>
    </div>
  );
}

function LiffMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[#3b2a1f]/10 p-3 text-[12px] text-[#3b2a1f]/75 flex items-center gap-2">
      {children}
    </div>
  );
}

function SmallSpinner() {
  return (
    <span className="h-3 w-3 rounded-full border-2 border-[#e89a5a] border-t-transparent animate-spin" />
  );
}

function UploadCard({
  fileInputRef,
  onPick,
  onDrop,
  onSample,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSample: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white border border-[#3b2a1f]/8 p-3">
        <div className="text-[11px] text-[#3b2a1f]/55 mb-1">病院からのメッセージ</div>
        <p className="text-[13px] text-[#3b2a1f]">
          こんにちは🐾　今日のごっちゃんの「ご様子レポート」を作成しませんか？
          下のメニューからお写真をお送りください。
        </p>
      </div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-[#3b2a1f]/20 p-5 text-center cursor-pointer hover:border-[#e89a5a]/60 bg-white"
      >
        <div className="text-3xl">📸</div>
        <p className="text-[13px] font-semibold text-[#3b2a1f] mt-1.5">
          お写真をアップロード
        </p>
        <p className="text-[10px] text-[#3b2a1f]/55 mt-0.5">
          タップ / ドラッグ（JPG・PNG, 10MB まで）
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
      </div>
      <button
        onClick={onSample}
        className="w-full px-3 py-2 rounded-full bg-[#3b2a1f]/5 text-[#3b2a1f] text-[12px] font-medium hover:bg-[#3b2a1f]/10"
      >
        🐈 サンプル写真で試す
      </button>
    </div>
  );
}

function ReadyCard({
  originalDataUrl,
  style,
  setStyle,
  onGenerate,
  onReset,
}: {
  originalDataUrl: string;
  style: StyleId;
  setStyle: (s: StyleId) => void;
  onGenerate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden bg-white border border-[#3b2a1f]/8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalDataUrl}
          alt="お写真プレビュー"
          className="w-full h-44 object-cover"
        />
        <div className="px-3 py-2 text-[11px] text-[#3b2a1f]/65">
          ✓ ペットのお写真を受信しました
        </div>
      </div>
      <div>
        <div className="text-[11px] text-[#3b2a1f]/65 mb-1.5">仕上げの画風</div>
        <div className="grid grid-cols-3 gap-1.5">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`rounded-xl border px-2 py-2 text-[11px] font-medium flex flex-col items-center gap-0.5 transition ${
                style === s.id
                  ? "bg-[#3b2a1f] text-[#fffaf2] border-[#3b2a1f]"
                  : "bg-white text-[#3b2a1f]/85 border-[#3b2a1f]/10 hover:border-[#3b2a1f]/30"
              }`}
              title={s.description}
            >
              <span className="text-base">{s.emoji}</span>
              <span className="leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-full text-[12px] font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
        >
          別の写真
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 px-3 py-2 rounded-full text-[13px] font-semibold bg-[#e89a5a] text-white hover:bg-[#d8884a] shadow-sm"
        >
          ✨ イラスト化する
        </button>
      </div>
      <p className="text-[10px] text-[#3b2a1f]/45 text-center">
        生成には約{ESTIMATED_SECONDS}秒かかります。
      </p>
    </div>
  );
}

function GeneratingCard({
  loadingMsg,
  elapsedSec,
}: {
  loadingMsg: string;
  elapsedSec: number;
}) {
  const pct = Math.min(96, Math.round((elapsedSec / ESTIMATED_SECONDS) * 100));
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white border border-[#3b2a1f]/8 p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#3b2a1f] mb-2">
          <SmallSpinner /> AIが描いています…
        </div>
        <p className="text-[11px] text-[#3b2a1f]/70 leading-relaxed">{loadingMsg}</p>
        <div className="mt-3 h-1.5 rounded-full bg-[#3b2a1f]/8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#e89a5a] to-[#f5b7c5] transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[#3b2a1f]/50 tabular-nums text-right">
          経過 {elapsedSec}s / 目安 約{ESTIMATED_SECONDS}s
        </p>
      </div>
      <p className="text-[10px] text-[#3b2a1f]/45 text-center">
        待合室体験に最適化済み。プレミアムプランは平均60秒。
      </p>
    </div>
  );
}

function DoneCard({
  petName,
  clinicName,
  onReset,
  onDownload,
  downloading,
}: {
  petName: string;
  clinicName: string;
  onReset: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#06c755]/8 border border-[#06c755]/30 p-3 text-[12px] text-[#3b2a1f]">
        🎉 {petName} のご様子レポートが完成しました！<br />
        右側のプレビューをご確認ください。
      </div>
      <button
        onClick={onDownload}
        disabled={downloading}
        className={`w-full px-3 py-2.5 rounded-full text-[13px] font-semibold transition ${
          downloading
            ? "bg-[#3b2a1f]/20 text-[#3b2a1f]/50 cursor-not-allowed"
            : "bg-[#e89a5a] text-white hover:bg-[#d8884a] shadow-sm"
        }`}
      >
        {downloading ? "保存中…" : "⬇ PNG画像で保存・転送"}
      </button>
      <button
        onClick={onReset}
        className="w-full px-3 py-2 rounded-full text-[12px] font-medium border border-[#3b2a1f]/15 bg-white hover:border-[#3b2a1f]/40"
      >
        別の写真でもう一度
      </button>
      <p className="text-[10px] text-[#3b2a1f]/45 text-center">
        画像は {clinicName} から返信されます。
      </p>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#3b2a1f]/12 p-10 text-center min-h-[420px] flex flex-col items-center justify-center gap-3 bg-white/40">
      <div className="text-5xl">🐾</div>
      <p className="text-sm font-medium text-[#3b2a1f]/70">
        左の LINE 画面からお写真をお送りください。
      </p>
      <p className="text-[11px] text-[#3b2a1f]/50 max-w-sm">
        AIが個体特徴を保ったまま、手書き風イラストに仕上げ、
        ここに「本日のご様子レポート」を表示します。
      </p>
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
    <details className="rounded-2xl border border-[#3b2a1f]/8 bg-white p-4 group">
      <summary className="cursor-pointer text-[13px] font-semibold text-[#3b2a1f] list-none flex items-center justify-between">
        <span>📝 病院スタッフ用：ご報告内容を編集</span>
        <span className="text-[10px] text-[#3b2a1f]/50 group-open:rotate-180 transition">▾</span>
      </summary>
      <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
        <LabeledInput label="ペットのお名前" value={petName} onChange={setPetName} />
        <LabeledInput label="病院名" value={clinicName} onChange={setClinicName} />
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
        {annotations.map((a) => (
          <div key={a.id} className="rounded-xl border border-[#3b2a1f]/8 p-2.5 bg-[#fdfaf3]">
            <input
              value={a.text}
              onChange={(e) => updateAnnotation(a.id, { text: e.target.value })}
              className="font-semibold text-[12px] text-[#3b2a1f] bg-transparent w-full border-b border-dashed border-[#3b2a1f]/15 focus:outline-none focus:border-[#e89a5a] pb-1"
            />
            <textarea
              value={a.detail}
              onChange={(e) => updateAnnotation(a.id, { detail: e.target.value })}
              className="w-full text-[11px] text-[#3b2a1f]/80 bg-transparent resize-none focus:outline-none mt-1.5"
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
      <span className="text-[10px] text-[#3b2a1f]/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-[#3b2a1f]/10 focus:outline-none focus:border-[#e89a5a] text-[12px]"
      />
    </label>
  );
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
