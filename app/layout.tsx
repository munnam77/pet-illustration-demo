import type { Metadata } from "next";
import { Noto_Sans_JP, Caveat } from "next/font/google";
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

export const metadata: Metadata = {
  title: "わんにゃん肖像 | 動物病院向けAIペットイラスト生成",
  description:
    "飼い主様のスマホから送られたペットのお写真を、その場で温かい手書き風イラストにしてお返しする、動物病院様向けAIサービス。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoJp.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fdf7ee] text-[#3b2a1f]">
        {children}
      </body>
    </html>
  );
}
