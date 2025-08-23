// app/layout.tsx
import Link from "next/link";
import "./globals.css";

export const metadata = { title: "MVP Landing", description: "Simple 2-page MVP" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-4xl flex items-center justify-between p-4">
            <div className="font-semibold">MVP</div>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About us</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
        <footer className="mx-auto max-w-4xl p-6 text-xs text-gray-500">© MVP</footer>
      </body>
    </html>
  );
}
