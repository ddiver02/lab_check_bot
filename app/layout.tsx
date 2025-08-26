// app/layout.tsx
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { Noto_Serif_KR } from "next/font/google";
import Image from "next/image";
import AnalyticsGA4 from "@/AnalyticsProvider"; // 클라이언트 컴포넌트

export const metadata = {
  title: "MVP Landing",
  description: "Simple 2-page MVP",
};

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif-kr",
});

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
            {/* 초기화: 자동 page_view 활성화 (send_page_view: false 제거!) */}
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${serif.variable} font-serif min-h-screen bg-white text-gray-900`}>
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-4xl flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Image src="/bot_fav.png" alt="서비스 로고" width={36} height={36} />
              <span className="font-semibold text-lg">책봇</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About us</Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-4xl p-6">{children}</main>

        <footer className="mx-auto max-w-4xl p-6 text-xs text-gray-500">© MVP</footer>

        {/* SPA 라우팅 시 page_view 보완 */}
        {GA4_ID && <AnalyticsGA4 gaId={GA4_ID} />}
      </body>
    </html>
  );
}