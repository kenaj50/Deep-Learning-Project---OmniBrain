import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  icon: z.string().min(1).max(10),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  context: z.string().max(2000).nullable().optional(),
});

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data }, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Get max sort_order so new company goes to end
  const { data: last } = await supabase
    .from("companies")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data }, { status: 201 });
}
