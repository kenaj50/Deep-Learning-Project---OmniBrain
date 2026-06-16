import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    date: s.updated_at,
  }));

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const { id, title } = await req.json();

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ id, title: title ?? "Nowa rozmowa", messages: [] })
    .select("id, title, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
