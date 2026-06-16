import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// GET — list archived tasks with company info
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, companies(id, name, icon, accent_color, slug, sort_order)")
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

// DELETE — permanently remove tasks archived more than 7 days ago
export async function DELETE() {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("status", "archived")
    .lt("updated_at", cutoff)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: data?.length ?? 0 });
}
