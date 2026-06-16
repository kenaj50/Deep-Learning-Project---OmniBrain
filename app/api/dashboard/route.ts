import { NextResponse } from "next/server";
import { fetchDashboard } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const data = await fetchDashboard();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd pobierania danych";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
