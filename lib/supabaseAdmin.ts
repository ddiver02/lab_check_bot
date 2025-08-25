import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY // 권장 이름
    ?? process.env.SUPABASE_SERVICE_ROLE; // 혹시 예전 이름을 썼다면 폴백

  if (!url || !key) {
    throw new Error("Missing Supabase server envs (URL or SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}