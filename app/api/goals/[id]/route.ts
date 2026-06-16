import { NextResponse } from "next/server";
import { deleteGoal, updateGoal } from "@/lib/supabase/queries";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const goal = await updateGoal(id, body);
    return NextResponse.json(goal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deleteGoal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
