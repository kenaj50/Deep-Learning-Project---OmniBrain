import { NextResponse } from "next/server";
import { deleteGoalEntry } from "@/lib/supabase/queries";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { entryId } = await params;
  try {
    await deleteGoalEntry(entryId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
