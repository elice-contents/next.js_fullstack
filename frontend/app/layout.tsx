import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "FastAPI + Next.js Blog",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/posts" className="font-bold text-elice text-lg tracking-tight">
              Blog
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/search" className="text-gray-500 hover:text-elice transition-colors">
                검색
              </Link>
              <Link
                href="/posts/new"
                className="bg-elice text-white px-3 py-1.5 rounded-lg hover:bg-elice-dark transition-colors"
              >
                새 글 작성
              </Link>
            </nav>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
