"use client";

import { useCallback, useRef, useState } from "react";
import { Card } from "./Card";
import { ReportFrame } from "./ReportFrame";
import {
  DEFAULT_ANNOTATIONS,
  STYLE_OPTIONS,
  type Annotation,
  type StyleId,
} from "./types";

const LOADING_MESSAGES = [
  "ペットのお写真を解析中…",
  "毛色・耳の形・体格を確認中…",
  "OpenAI gpt-image-2 で処理中…",
  "手書き風の吹き出しを配置中…",
  "肉球スタンプとハートを描き加えています…",
  "デコレーションフレームを仕上げ中…",
  "病院ロゴ・お名前を合成中…",
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
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleId>("watercolor");
  const [loading, setLoading] = useState(false);
  const [screening, setScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>) =>
      setAnnotations(annotations.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [annotations, setAnnotations],
  );

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

    setScreening(true);
    setError(null);
    try {
      const screenFd = new FormData();
      screenFd.append("image", originalFile);
      const screenRes = await fetch("/api/screen", { method: "POST", body: screenFd });
      const screenData = await screenRes.json();
      if (screenRes.ok && screenData?.allowed === false) {
        setScreening(false);
        setError(
          screenData.reason_ja ||
            "ペット以外の写真が検出されました。ペットの写真をアップロードしてください。",
        );
        return;
      }
    } catch (e) {
      console.warn("[screen] failed, continuing:", e);
    } finally {
      setScreening(false);
    }

    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    setLoadingMsgIdx(0);
    setElapsedSec(0);
    const startedAt = Date.now();
    const msgTick = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 10_000);
    const secTick = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    try {
      const fd = new FormData();
      fd.append("image", originalFile);
      fd.append("style", style);
      if (logoFile) fd.append("logo", logoFile);
      if (clinicName) fd.append("clinicName", clinicName);
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
  }, [originalFile, style, logoFile, clinicName]);

  const onReset = useCallback(() => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setGeneratedUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

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

      {originalUrl && !loading && !screening && (
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
        </Card>
      )}

      {screening && (
        <Card>
          <p className="text-sm text-[#3b2a1f]/70 text-center py-2">
            🔍 写真がペットかどうかを確認中…（不適切画像検出）
          </p>
        </Card>
      )}

      {originalUrl && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="飼い主様から送られた写真" badge="Original">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#3b2a1f]/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="original" className="w-full h-full object-cover" />
            </div>
          </Card>

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
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

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
            🐩 サンプル写真で試す
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
        <span>📝 ご報告内容を編集する（病院様側のコメント編集機能）</span>
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
      title: "飼い主様（LINE / LIFF）",
      body: "病院のLINE公式アカウントに友だち追加 →「ペット画像を作る」メニューからLIFFが起動 → 写真と画風を選択。",
    },
    {
      icon: "🤖",
      title: "サーバーサイド処理",
      body: "OpenAI Vision で簡易ペット判定 → gpt-image-2 で個体特徴を保持したまま手書き風イラストへ変換 → 病院ロゴと名称を合成。",
    },
    {
      icon: "💌",
      title: "LINEで自動返信",
      body: "本日のご様子コメント付きで飼い主様のLINEへ配信。保存・転送がそのまま可能。利用ログは病院管理画面で集計。",
    },
  ];
  return (
    <div className="paper rounded-3xl p-6 sm:p-8">
      <h2 className="font-semibold text-lg text-[#3b2a1f] mb-4">🪄 サービス全体の仕組み</h2>
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
