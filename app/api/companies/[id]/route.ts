import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().min(1).max(10).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sort_order: z.number().int().optional(),
  context: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Check if company has tasks
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id)
    .neq("status", "archived");

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Nie można usunąć firmy z ${count} aktywnymi zadaniami. Najpierw przenieś lub usuń zadania.` },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
