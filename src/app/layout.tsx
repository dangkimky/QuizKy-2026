import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizVerse Builder - Nền Tảng Web Game Trắc Nghiệm Tự Động",
  description: "Chỉ cần import file DOCX, PDF, CSV, XLSX, TXT. Hệ thống AI tự động giải mã, chia màn chơi 50 câu và tạo game trắc nghiệm game hóa cực đỉnh, hỗ trợ đổi pet, skin Cyberpunk, Neon...",
  keywords: ["QuizVerse", "Web Game Trắc Nghiệm", "Tự Động Sinh Game", "Trắc Nghiệm Game Hóa", "AI Parser Quiz"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <head>
        {/* Preload Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;700;900&family=Orbitron:wght@400;700;900&family=Outfit:wght@400;600;800;900&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-black text-slate-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
