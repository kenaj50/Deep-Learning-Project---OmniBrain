import { NextResponse } from "next/server";
import { addGoalEntry } from "@/lib/supabase/queries";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { amount, note } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Kwota musi być liczbą większą od 0" }, { status: 400 });
  }

  try {
    const entry = await addGoalEntry(id, Number(amount), note);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
