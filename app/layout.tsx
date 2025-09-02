// app/layout.tsx
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Noto_Sans_KR } from "next/font/google";
import Image from "next/image";
import { Suspense } from "react";
import GTMProvider from "@/GTMProvider"; // 클라이언트 컴포넌트

export const metadata = {
  title: "📚 책봍 🤖",
  description: "안녕하세요 책봍 입니다. 우리는 사용자가 입력한 상황 또는 감정에 적합한 인용구를 찾아주는 AI 기반의 서비스를 제공합니다."
};

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="ko">
      <head>
        {GTM_ID && (
          <Script id="gtm-base" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}
      </head>
      <body className={`${notoSansKr.variable} font-sans min-h-screen bg-white text-gray-900`}>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <header className="header-bookish">
          <nav className="mx-auto max-w-4xl flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Image src="/bot_fav.png" alt="서비스 로고" width={36} height={36} />
              <span className="font-semibold layout-brand">책봍</span>
              <span className="bookmark-accent" aria-hidden="true"></span>
            </div>
            <div className="flex gap-4 layout-nav">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About us</Link>
            </div>
          </nav>
        </header>
        
        <main className="mx-auto max-w-4xl p-6">{children}
        <Analytics/>  
        </main>

        <footer className="mx-auto max-w-4xl p-6 text-xs text-gray-500">
          <p className="layout-footer text-gray-400 text-center">
       검색 기록은 데이터 분석에 활용 후 폐기 됩니다. <br></br>
       
      </p>
      <br></br>
          
        <p className="layout-footer text-center">  ©책봍</p>
          
          </footer>

        {/* SPA 라우팅 시 page_view 보완 (GTM dataLayer) */}
        {GTM_ID && (
          <Suspense fallback={null}>
            <GTMProvider />
          </Suspense>
        )}
      </body>
    </html>
  );
}
