import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const ReorderSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })),
});

export async function PATCH(req: Request) {
  const body = await req.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const updates = parsed.data.order.map(({ id, sort_order }) =>
    supabase.from("tasks").update({ sort_order }).eq("id", id),
  );

  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
