/** @type {import('next').NextConfig} */
// 접두사 없이 .env(.local)에 명시된 값 그대로 사용
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_GENKIT_API_URL: process.env.NEXT_PUBLIC_GENKIT_API_URL,
  },
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_GENKIT_API_URL;
    return base
      ? [{ source: '/api/quote/:path*', destination: `${base}/api/quote/:path*` }]
      : [];
  },
};

module.exports = nextConfig;
