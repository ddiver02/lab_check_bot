// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import { Noto_Serif_KR } from "next/font/google";

export const metadata = {
  title: "MVP Landing",
  description: "Simple 2-page MVP",
};

// 폰트 (원하는 폰트로 교체 가능)
const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif-kr",
});

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* ✅ GTM: head용 스니펫 */}
        {GTM_ID && (
          <Script
            id="gtm-head"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
            }}
          />
        )}
      </head>

      <body className={`${serif.variable} font-serif min-h-screen bg-gray-50 text-gray-900`}>
        {/* ✅ GTM: <body> 바로 아래 noscript */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : (
          <script
            dangerouslySetInnerHTML={{
              __html: `console.warn('[GTM] Missing NEXT_PUBLIC_GTM_ID');`,
            }}
          />
        )}

        {/* 헤더 */}
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-4xl flex items-center justify-between p-4">
            <div className="font-semibold">MVP</div>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/about" className="hover:underline">
                About us
              </Link>
            </div>
          </nav>
        </header>

        {/* 메인 */}
        <main className="mx-auto max-w-4xl p-6">{children}</main>

        {/* 푸터 */}
        <footer className="mx-auto max-w-4xl p-6 text-xs text-gray-500">© MVP</footer>
      </body>
    </html>
  );
}