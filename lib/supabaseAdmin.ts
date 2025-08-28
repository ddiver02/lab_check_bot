import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "./runtimeEnv";

export function getSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceRoleKey } = serverEnv();

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE)");
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  // 타입 안전: 누락 검사 후 명시적 캐스팅
  const url: string = supabaseUrl as string;
  const key: string = supabaseServiceRoleKey as string;
  return createClient(url, key, { auth: { persistSession: false } });
}
