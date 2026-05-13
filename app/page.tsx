"use client";

import { useState } from "react";
import { Hero } from "./components/Hero";
import { OwnerTab } from "./components/OwnerTab";
import { ClinicAdminTab } from "./components/ClinicAdminTab";
import { SustainerAdminTab } from "./components/SustainerAdminTab";
import { SpecTab } from "./components/SpecTab";
import {
  DEFAULT_ANNOTATIONS,
  STYLE_OPTIONS,
  type Annotation,
  type StyleId,
} from "./components/types";

type TabId = "owner" | "clinic" | "sustainer" | "spec";

const TABS: { id: TabId; label: string; role: string; emoji: string }[] = [
  { id: "owner", label: "飼い主モード", role: "Owner", emoji: "📱" },
  { id: "clinic", label: "病院スタッフ", role: "Clinic", emoji: "🏥" },
  { id: "sustainer", label: "運営", role: "Operator", emoji: "🛠" },
  { id: "spec", label: "プラン・仕様", role: "Plan", emoji: "📄" },
];

export default function HomePage() {
  const [tab, setTab] = useState<TabId>("owner");

  const [petName, setPetName] = useState("チョコちゃん");
  const [clinicName, setClinicName] = useState("桜が丘どうぶつクリニック");
  const [annotations, setAnnotations] = useState<Annotation[]>(DEFAULT_ANNOTATIONS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [enabledStyles, setEnabledStyles] = useState<Set<StyleId>>(
    new Set(STYLE_OPTIONS.map((s) => s.id)),
  );

  return (
    <div className="flex-1 w-full">
      <Hero />

      <nav className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="rounded-2xl bg-white/70 backdrop-blur border border-[#3b2a1f]/8 px-1 py-1 flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] uppercase tracking-widest text-[#3b2a1f]/40 px-2 hidden sm:inline">
            ロール
          </span>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[7.5rem] px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                  active
                    ? "bg-[#3b2a1f] text-[#fffaf2] shadow-sm"
                    : "text-[#3b2a1f]/70 hover:text-[#3b2a1f] hover:bg-[#3b2a1f]/5"
                }`}
              >
                <span>{t.emoji}</span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {tab === "owner" && (
          <OwnerTab
            petName={petName}
            setPetName={setPetName}
            clinicName={clinicName}
            setClinicName={setClinicName}
            annotations={annotations}
            setAnnotations={setAnnotations}
            logoFile={logoFile}
          />
        )}
        {tab === "clinic" && (
          <ClinicAdminTab
            clinicName={clinicName}
            setClinicName={setClinicName}
            petName={petName}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            enabledStyles={enabledStyles}
            setEnabledStyles={setEnabledStyles}
          />
        )}
        {tab === "sustainer" && <SustainerAdminTab />}
        {tab === "spec" && <SpecTab />}
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#3b2a1f]/10 mt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#3b2a1f]/55">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-[#e89a5a]/85 flex items-center justify-center text-white text-xs">
            🐾
          </span>
          <span className="font-medium text-[#3b2a1f]/75">わんにゃん肖像</span>
          <span>© 2026 株式会社サスティナ</span>
        </div>
        <div className="flex items-center gap-4">
          <a className="hover:text-[#3b2a1f]" href="#">利用規約</a>
          <a className="hover:text-[#3b2a1f]" href="#">プライバシー</a>
          <a className="hover:text-[#3b2a1f]" href="#">特定商取引法</a>
          <a className="hover:text-[#3b2a1f]" href="#">お問い合わせ</a>
        </div>
      </div>
    </footer>
  );
}
