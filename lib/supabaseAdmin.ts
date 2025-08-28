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
  return createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
}
