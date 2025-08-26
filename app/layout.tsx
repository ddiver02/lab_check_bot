// app/layout.tsx
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { Noto_Serif_KR } from "next/font/google";
import AnalyticsGA4 from "@/components/AnalyticsGA4"; // ✅ 클라이언트 컴포넌트 임포트

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif-kr",
});

export const metadata = {
  title: "MVP Landing",
  description: "Simple 2-page MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

  return (
    <html lang="ko">
      <head>
        {GA4_ID && (
          <>
            {/* GA4 라이브러리 */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            {/* 초기화: page_view는 클라 컴포넌트에서 보냄 */}
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${serif.variable} font-serif min-h-screen bg-gray-50 text-gray-900`}>
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

        {/* 페이지뷰 추적 */}
        {GA4_ID && <AnalyticsGA4 gaId={GA4_ID} />}
      </body>
    </html>
  );
}