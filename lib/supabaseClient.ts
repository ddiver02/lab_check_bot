import { createClient, type SupabaseClient } from "@supabase/supabase-js"; // lib/supabaseClient.ts

let _client: SupabaseClient | null = null;

// 브라우저에서 호출될 때만 클라이언트 생성
export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    // 서버/빌드 단계에서는 만들지 않음
    throw new Error("Supabase client is only available in the browser.");
  }
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase env missing. Check .env.local or Vercel env.");
    }
    _client = createClient(url, key);
  }
  return _client;
}
