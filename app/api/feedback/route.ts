// app/api/feedback/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Mode = "harsh" | "comfort" | "random";
type FeedbackAction = "like";

type FeedbackBody = {
  // action is now only 'like'; if omitted, treated as 'like'
  action?: FeedbackAction;
  quote_id: number;
  user_input_id?: number; // preferred if available
  // Optional denormalized context (fallback)
  input_text?: string;
  selected_mode?: Mode;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const body = raw as Partial<FeedbackBody>;
  const action: FeedbackAction = 'like';
  const quote_id = body.quote_id;
  const user_input_id = body.user_input_id;

  if (!quote_id || typeof quote_id !== "number") {
    return bad("'quote_id' must be a number");
  }
  if (!user_input_id || typeof user_input_id !== 'number') {
    return bad("'user_input_id' must be a number");
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg, hint: "Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  try {
    // 1) 먼저 업데이트 시도 (placeholder NULL에서 like로 변경)
    const { data: updData, error: updErr } = await admin
      .from('user_feedback')
      .update({ action })
      .eq('user_input_id', user_input_id)
      .eq('quote_id', quote_id)
      .select('id');
    if (!updErr && updData && updData.length > 0) {
      return NextResponse.json({ ok: true, updated: true });
    }

    // 2) 없으면 삽입
    const payload: Record<string, unknown> = {
      quote_id,
      user_input_id,
      action,
    };
    if (typeof body.input_text === "string") payload.input_text = body.input_text;
    if (typeof body.selected_mode === "string") payload.selected_mode = body.selected_mode;

    const { error: insErr } = await admin.from("user_feedback").insert(payload);
    if (insErr) throw insErr;
    return NextResponse.json({ ok: true, inserted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
