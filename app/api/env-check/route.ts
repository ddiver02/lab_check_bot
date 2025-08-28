// app/api/env-check/route.ts
import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/runtimeEnv";

export const runtime = "nodejs";

export async function GET() {
  const pub = publicEnv();
  return NextResponse.json({
    NEXT_PUBLIC_GA4_ID: pub.GA4_ID ? "set" : "",
    NEXT_PUBLIC_GENKIT_API_URL: pub.GENKIT_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: pub.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pub.SUPABASE_ANON_KEY ? "set" : "",
  });
}
