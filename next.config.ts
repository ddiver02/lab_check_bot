/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/quote/:path*',
        destination: 'https://genkit-demo-975542676508.asia-northeast3.run.app/api/quote/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
