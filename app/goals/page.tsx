"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Heart, Loader2, MessageCircleHeart, Pencil, Target } from "lucide-react";
import type { GoalProgress, GoalStatus } from "@/lib/goals";
import { IconTile } from "@/lib/ui";

type Data = { goals: GoalProgress[]; windowDays?: number; checkInCount?: number };

function cheer(g: GoalProgress) {
  const partial = g.timeline.filter((t) => t.status === "partial").length;
  if (g.metCount >= 3) return "You're building a real habit here. That's huge.";
  if (g.metCount >= 1) return "You're on your way. Every time counts.";
  if (partial > 0) return "You've been making efforts here. Keep going.";
  return "Not showing up in your check-ins yet, and that's okay. Maybe try it today?";
}

const dot: Record<GoalStatus, string> = {
  met: "bg-accent border-accent text-white",
  partial: "bg-accent-soft border-accent text-accent",
  not_mentioned: "bg-card border-line text-muted",
};

export default function Goals() {
  const [data, setData] = useState<Data | null>(null);
  const [logging, setLogging] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/goals");
    setData(r.ok ? await r.json() : { goals: [] });
  }, []);
  useEffect(() => { load(); }, [load]);

  const didIt = async (goal: string) => {
    setLogging(goal);
    await fetch("/api/checkins", { method: "POST", body: JSON.stringify({ mode: "quick", entries: { goals: [goal] } }) });
    await load();
    setLogging(null);
  };

  if (!data) return <p className="flex items-center gap-2 text-muted"><Loader2 size={16} className="animate-spin" /> Looking over your recent check-ins…</p>;

  if (data.goals.length === 0) {
    return (
      <div className="space-y-3 rounded-3xl border border-line bg-card p-6 text-center shadow-soft">
        <div className="flex justify-center"><IconTile icon={Target} tone="sage" size="lg" /></div>
        <h1 className="text-xl font-semibold">No goals yet</h1>
        <p className="text-sm text-muted">Pick a few small goals to work toward, from a list or in your own words.</p>
        <Link href="/onboarding" className="inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-soft">Set my goals</Link>
      </div>
    );
  }

  const withProgress = data.goals.filter((g) => g.timeline.some((t) => t.status !== "not_mentioned")).length;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Your goals</h1>
          <p className="mt-2 flex items-start gap-2 text-accent-strong">
            <Heart size={18} className="mt-0.5 shrink-0" fill="currentColor" aria-hidden /> You made progress on {withProgress} of {data.goals.length} goal{data.goals.length === 1 ? "" : "s"} in the last {Math.round((data.windowDays ?? 14) / 7)} weeks.
          </p>
          <p className="text-sm text-muted">Based on your {data.checkInCount} check-ins. Progress, not perfection.</p>
        </div>
        <Link href="/onboarding" className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-muted"><Pencil size={14} /> Edit</Link>
      </section>

      {data.goals.map((g) => {
        const n = g.timeline.length;
        const partial = g.timeline.filter((t) => t.status === "partial").length;
        const pct = n ? Math.round(((g.metCount + partial * 0.5) / n) * 100) : 0;
        return (
          <section key={g.goal} className="rounded-3xl border border-line bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="flex gap-3">
                <IconTile icon={Target} tone="sage" size="sm" />
                <div>
                <h2 className="text-lg font-semibold leading-snug">{g.goal}</h2>
                <p className="text-sm text-muted">Showed up in {g.metCount} of {n} check-ins{partial ? `, plus ${partial} partly` : ""}</p>
                </div>
              </div>
              <button onClick={() => didIt(g.goal)} disabled={logging !== null}
                className="flex items-center gap-1.5 self-start shrink-0 rounded-full bg-accent-soft px-3.5 py-2 text-sm font-semibold text-accent-strong transition hover:bg-accent hover:text-white disabled:opacity-40">
                {logging === g.goal ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Check size={15} strokeWidth={2.5} /> I did this today</>}
              </button>
            </div>

            <div className="my-3 h-2.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-gradient-to-r from-[#e0906c] to-accent transition-all" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {g.timeline.map((t) => {
                const d = new Date(t.date);
                return (
                  <div key={t.checkInId} title={t.evidence || "Not mentioned"} className="flex flex-col items-center gap-0.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${dot[t.status]}`}>
                      {t.status === "met" ? <Check size={14} strokeWidth={3} /> : t.status === "partial" ? "½" : ""}
                    </span>
                    <span className="text-[10px] text-muted">{d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</span>
                  </div>
                );
              })}
            </div>

            {g.latestEvidence && <p className="mt-3 flex gap-2 text-sm"><MessageCircleHeart size={17} className="shrink-0 text-accent" aria-hidden /><span>Recently: <span className="italic">&ldquo;{g.latestEvidence}&rdquo;</span></span></p>}
            <p className="mt-1 text-sm text-muted">{cheer(g)}</p>
          </section>
        );
      })}

      <p className="flex gap-4 text-xs text-muted">
        <span><span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" /> Did it</span>
        <span><span className="inline-block h-2.5 w-2.5 rounded-full border border-accent bg-accent-soft" /> Partly</span>
        <span><span className="inline-block h-2.5 w-2.5 rounded-full border border-line bg-card" /> Not mentioned</span>
      </p>
    </div>
  );
}
