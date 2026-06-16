import { NextResponse } from "next/server";
import { createGoal, getActiveGoal } from "@/lib/supabase/queries";

export async function GET() {
  const goal = await getActiveGoal();
  return NextResponse.json({ goal });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, target_amount, start_date, end_date, currency } = body;

  if (!title?.trim() || !target_amount || !start_date || !end_date) {
    return NextResponse.json({ error: "Brakuje wymaganych pól" }, { status: 400 });
  }

  try {
    const goal = await createGoal({ title, target_amount, start_date, end_date, currency });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
