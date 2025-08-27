

import HomeClient from "./HomeClient";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const resolvedSearchParams = await Promise.resolve(searchParams); // Workaround for Next.js error
  const quote = resolvedSearchParams.quote as string || "한 문장을 선물드려요.";
  const author = resolvedSearchParams.author as string || "";
  const source = resolvedSearchParams.source as string || "";

  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/og-image?quote=${encodeURIComponent(quote)}&author=${encodeURIComponent(author)}&source=${encodeURIComponent(source)}`;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
    title: "책봍 - " + quote,
    description: `${quote} — ${author}${source ? ` · ${source}` : ""}`,
    openGraph: {
      title: "책봍 - " + quote,
      description: `${quote} — ${author}${source ? ` · ${source}` : ""}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "책봍 인용구 카드",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "책봍 - " + quote,
      description: `${quote} — ${author}${source ? ` · ${source}` : ""}`,
      images: [ogImageUrl],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}