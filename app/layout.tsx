// app/layout.tsx
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Noto_Sans_KR } from "next/font/google";
import Image from "next/image";
import AnalyticsGA4 from "@/AnalyticsProvider"; // 클라이언트 컴포넌트

export const metadata = {
  title: "📚 책봍 테스트 페이지",
  description: "여기스 테스트용 페이지 입니다.",
};

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
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
      <body className={`${notoSansKr.variable} font-sans min-h-screen bg-white text-gray-900`}>
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-4xl flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Image src="/bot_fav.png" alt="서비스 로고" width={36} height={36} />
              <span className="font-semibold text-lg">책봍</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About us</Link>
            </div>
          </nav>
        </header>
        
        <main className="mx-auto max-w-4xl p-6">{children}
        <Analytics/>  
        </main>

        <footer className="mx-auto max-w-4xl p-6 text-xs text-gray-500">
          <p className="text-xs text-gray-400 text-center">
       검색 기록은 데이터 분석에 활용 후 폐기 됩니다. <br></br>
       
      </p>
      <br></br>
          
        <p className="text-center">  ©책봍</p>
          
          </footer>

        {/* SPA 라우팅 시 page_view 보완 */}
        {GA4_ID && <AnalyticsGA4 gaId={GA4_ID} />}
      </body>
    </html>
  );
}