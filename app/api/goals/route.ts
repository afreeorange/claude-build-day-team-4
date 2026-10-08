import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";
import { splitGoals, type GoalAssessment, type GoalProgress } from "@/lib/goals";
import { getCheckIns, getGoalAssessments, getProfile, saveGoalAssessments } from "@/lib/store";

const WINDOW_DAYS = 14;

const SYSTEM = `You review a patient's recent check-ins for a dietitian-led lifestyle program and judge, for each of the patient's goals, whether each check-in shows progress toward it.

For every (check-in, goal) pair, return a status:
- "met": the check-in clearly shows the patient did what the goal describes.
- "partial": some effort or partial progress toward the goal.
- "not_mentioned": the check-in doesn't say anything relevant. When in doubt, use this. Never assume.

entries.goals in a check-in is a list of goals the patient self-reported working on; count those as "met".

evidence: shown directly to the patient. A short phrase (under 10 words) quoting or closely paraphrasing what the patient actually did, e.g. "Cottage cheese and fruit at lunch". Only describe what they did, never what was missing or unclear. Empty string for "not_mentioned".`;

type RawAssessment = { checkin_id: string; goal_number: number; status: GoalAssessment["status"]; evidence: string };

export async function GET() {
  const profile = await getProfile();
  const goals = splitGoals(profile?.dietitianGoals ?? "");
  if (goals.length === 0) return NextResponse.json({ goals: [] });

  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
  const checkIns = (await getCheckIns())
    .filter((c) => new Date(c.date).getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));

  const key = (id: string, goal: string) => `${id}::${goal}`;
  const known = new Map((await getGoalAssessments()).map((a) => [key(a.checkInId, a.goal), a]));
  // Goals the patient checked off themselves don't need Claude to judge them.
  for (const c of checkIns) {
    const ticked = Array.isArray(c.entries.goals) ? (c.entries.goals as string[]) : [];
    for (const g of ticked)
      if (goals.includes(g) && !known.has(key(c.id, g)))
        known.set(key(c.id, g), { checkInId: c.id, goal: g, status: "met", evidence: "You checked this off" });
  }
  const pending = checkIns.filter((c) => goals.some((g) => !known.has(key(c.id, g))));

  if (pending.length > 0) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              assessments: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    checkin_id: { type: "string" },
                    goal_number: { type: "integer" },
                    status: { type: "string", enum: ["met", "partial", "not_mentioned"] },
                    evidence: { type: "string" },
                  },
                  required: ["checkin_id", "goal_number", "status", "evidence"],
                },
              },
            },
            required: ["assessments"],
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Goals:\n${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}\n\nCheck-ins:\n${JSON.stringify(
            pending.map((c) => ({ checkin_id: c.id, date: c.date.slice(0, 10), entries: c.entries, summary: c.summary })),
            null,
            1
          )}\n\nAssess every check-in against every goal.`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text");
    const out: RawAssessment[] = text && text.type === "text" ? JSON.parse(text.text).assessments : [];
    const ids = new Set(pending.map((c) => c.id));
    for (const a of out) {
      const goal = goals[a.goal_number - 1];
      if (!goal || !ids.has(a.checkin_id)) continue;
      known.set(key(a.checkin_id, goal), { checkInId: a.checkin_id, goal, status: a.status, evidence: a.evidence });
    }
    // Anything the model skipped counts as not mentioned, so we don't re-ask forever.
    for (const c of pending)
      for (const g of goals)
        if (!known.has(key(c.id, g))) known.set(key(c.id, g), { checkInId: c.id, goal: g, status: "not_mentioned", evidence: "" });
    await saveGoalAssessments([...known.values()]);
  }

  const progress: GoalProgress[] = goals.map((goal) => {
    const timeline = checkIns.map((c) => {
      const a = known.get(key(c.id, goal))!;
      return { checkInId: c.id, date: c.date, status: a.status, evidence: a.evidence };
    });
    return {
      goal,
      timeline,
      metCount: timeline.filter((t) => t.status === "met").length,
      latestEvidence: [...timeline].reverse().find((t) => t.status !== "not_mentioned")?.evidence,
    };
  });

  return NextResponse.json({ goals: progress, windowDays: WINDOW_DAYS, checkInCount: checkIns.length });
}
