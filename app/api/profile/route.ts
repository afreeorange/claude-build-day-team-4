import { NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await getProfile());
}

export async function POST(req: Request) {
  const profile = await req.json();
  await saveProfile(profile);
  return NextResponse.json(profile);
}
