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

const TABS: { id: TabId; label: string; sub: string; emoji: string }[] = [
  { id: "owner", label: "飼い主体験", sub: "LINE / LIFF プレビュー", emoji: "📱" },
  { id: "clinic", label: "病院管理画面", sub: "Clinic Console", emoji: "🏥" },
  { id: "sustainer", label: "弊社管理画面", sub: "Operator Console", emoji: "🛠" },
  { id: "spec", label: "技術仕様 / お見積り", sub: "Tech & Quote", emoji: "📄" },
];

export default function HomePage() {
  const [tab, setTab] = useState<TabId>("owner");

  const [petName, setPetName] = useState("チョコちゃん");
  const [clinicName, setClinicName] = useState("○○動物病院");
  const [annotations, setAnnotations] = useState<Annotation[]>(DEFAULT_ANNOTATIONS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [enabledStyles, setEnabledStyles] = useState<Set<StyleId>>(
    new Set(STYLE_OPTIONS.map((s) => s.id)),
  );

  return (
    <div className="flex-1 w-full">
      <Hero />

      <nav className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="paper rounded-2xl p-2 flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[10rem] px-3 py-2.5 rounded-xl text-left transition ${
                  active
                    ? "bg-[#3b2a1f] text-[#fffaf2]"
                    : "bg-transparent text-[#3b2a1f] hover:bg-[#3b2a1f]/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.emoji}</span>
                  <span className="font-semibold text-sm">{t.label}</span>
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    active ? "text-[#fffaf2]/65" : "text-[#3b2a1f]/50"
                  }`}
                >
                  {t.sub}
                </div>
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
    <footer className="border-t border-[#3b2a1f]/10 mt-4 py-8 text-center text-xs text-[#3b2a1f]/50">
      <p>
        Prototype built by{" "}
        <a className="underline" href="https://cognitiveappdev.com" target="_blank" rel="noreferrer">
          Cognitive AppDev
        </a>{" "}
        — Powered by OpenAI gpt-image-2 + Next.js 16
      </p>
      <p className="mt-1">© 2026 Cognitive AppDev — for evaluation only</p>
    </footer>
  );
}
