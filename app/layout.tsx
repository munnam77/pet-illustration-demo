import type { Metadata } from "next";
import { Noto_Sans_JP, Caveat, Klee_One, Yusei_Magic } from "next/font/google";
import "./globals.css";

const notoJp = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const caveat = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const kleeOne = Klee_One({
  variable: "--font-jp-handwritten",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const yuseiMagic = Yusei_Magic({
  variable: "--font-jp-brush",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "わんにゃん肖像 — 動物病院 × LINE 公式アカウント向け AI ペットイラスト",
  description:
    "ペットの写真をLINEで送るだけで、個体特徴を保ったまま手書き風イラストに。動物病院様の待合室体験を、その場で「思い出になる一枚」に変える AI サービス。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoJp.variable} ${caveat.variable} ${kleeOne.variable} ${yuseiMagic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fdf7ee] text-[#3b2a1f]">
        {children}
      </body>
    </html>
  );
}
