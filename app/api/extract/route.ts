import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";
import { addCheckIn, getProfile } from "@/lib/store";
import { TRACKING_ITEMS } from "@/lib/tracking";
import type { CheckIn, Mode } from "@/lib/types";

const SYSTEM = `You turn a patient's check-in (a voice conversation transcript or a free-text journal entry) into a structured log for their dietitian's program.

Rules:
- Record ONLY what the patient actually said. Never infer, guess, or fill in values. Omit fields that weren't mentioned.
- Only use the tracking fields provided in the tool schema; ignore other topics.
- red_flags: list any symptoms that warrant contacting the care team promptly, quoting the patient briefly. Examples: vomiting that won't stop or can't keep fluids down, severe or persistent abdominal pain (possibly radiating to the back), signs of dehydration, symptoms of low blood sugar (shaky, sweaty, confused), yellowing skin or eyes, severe allergic reaction, surgical wound concerns, thoughts of self-harm or hopelessness. Leave empty if none.
- summary: one warm, non-judgmental sentence that reflects something the patient did well (self-efficacy). No advice.
- follow_up: one gentle, open question to ask at the next check-in, based on what they shared.
- Never give medical, medication, or dose advice.`;

export async function POST(req: Request) {
  const { text, mode } = (await req.json()) as { text: string; mode: Mode };
  const profile = await getProfile();
  const tracked = TRACKING_ITEMS.filter((i) => profile?.trackingItems.includes(i.id) ?? true);

  const entryProps = Object.fromEntries(tracked.map((i) => [i.id, i.schema]));

  const schema = strict({
    type: "object",
    properties: {
      entries: { type: "object", properties: entryProps, description: "Only fields the patient mentioned" },
      red_flags: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
      follow_up: { type: "string" },
    },
    required: ["entries", "red_flags", "summary", "follow_up"],
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema } },
    messages: [
      {
        role: "user",
        content: `Patient check-in (${mode === "voice" ? "voice conversation transcript" : "written journal entry"}):\n\n<checkin>\n${text}\n</checkin>`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No log extracted" }, { status: 500 });
  }
  const out = JSON.parse(textBlock.text) as { entries: Record<string, unknown>; red_flags: string[]; summary: string; follow_up: string };

  const checkIn: CheckIn = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode,
    entries: out.entries ?? {},
    redFlags: out.red_flags ?? [],
    summary: out.summary,
    followUp: out.follow_up,
  };
  return NextResponse.json(await addCheckIn(checkIn));
}

// Structured outputs need closed objects and don't accept numeric range keywords.
function strict(node: unknown): Record<string, unknown> {
  if (Array.isArray(node)) return node.map(strict) as unknown as Record<string, unknown>;
  if (!node || typeof node !== "object") return node as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === "minimum" || k === "maximum") continue;
    out[k] = typeof v === "object" ? strict(v) : v;
  }
  if (out.type === "object") out.additionalProperties = false;
  return out;
}
