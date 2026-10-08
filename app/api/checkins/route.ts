import { NextResponse } from "next/server";
import { addCheckIn, getCheckIns } from "@/lib/store";
import type { CheckIn } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getCheckIns());
}

// Quick-tap logs come here directly, no LLM involved.
export async function POST(req: Request) {
  const body = (await req.json()) as Pick<CheckIn, "entries" | "mode">;
  const checkIn: CheckIn = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: body.mode ?? "quick",
    entries: body.entries,
    redFlags: [],
  };
  return NextResponse.json(await addCheckIn(checkIn));
}
