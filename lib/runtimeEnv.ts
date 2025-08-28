// lib/runtimeEnv.ts
// 접두사 없이 .env(.local) 값을 그대로 읽는 간단 유틸

export function publicEnv() {
  return {
    GA4_ID: process.env.NEXT_PUBLIC_GA4_ID || "",
    GENKIT_API_URL: process.env.NEXT_PUBLIC_GENKIT_API_URL || "",
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

// 서버 전용(비밀 포함). 클라이언트에서 import 금지.
export function serverEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    googleApiKey,
  };
}
