"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CheckInCard from "@/components/CheckInCard";
import { CheckInCalendar, CountBars, LineChart, type Point } from "@/components/Charts";
import { BookOpen, CalendarDays, Heart, Pill, Scale, Smile, Droplets, Moon } from "lucide-react";
import type { CheckIn } from "@/lib/types";
import { IconTile, type Tone } from "@/lib/ui";

const DAY = 86_400_000;

function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay());
  return s.getTime();
}

function groupLabel(date: string) {
  const t = new Date(date).getTime();
  const thisWeek = startOfWeek(new Date());
  if (t >= thisWeek) return "This week";
  if (t >= thisWeek - 7 * DAY) return "Last week";
  return new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

const MOOD_LABELS: Record<number, string> = { 1: "Rough", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };

function series(checkIns: CheckIn[], pick: (c: CheckIn) => number | undefined, note?: (c: CheckIn) => string | undefined): Point[] {
  const out: Point[] = [];
  for (const c of checkIns) {
    const value = pick(c);
    if (typeof value === "number" && !Number.isNaN(value)) out.push({ date: c.date, value, note: note?.(c) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function Card({ title, subtitle, icon, tone = "peach", children }: { title: string; subtitle?: React.ReactNode; icon?: typeof Heart; tone?: Tone; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4 shadow-soft">
      <div className={`flex items-center gap-2.5 ${subtitle ? "" : "mb-2"}`}>
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {subtitle && <p className="mt-1 mb-3 text-sm text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}

function Patterns({ checkIns }: { checkIns: CheckIn[] }) {
  const weight = series(checkIns, (c) => c.entries.weight as number | undefined);
  const mood = series(
    checkIns,
    (c) => (c.entries.mood as { score?: number } | undefined)?.score,
    (c) => (c.entries.mood as { note?: string } | undefined)?.note
  );
  const water = series(checkIns, (c) => c.entries.water as number | undefined);
  const sleep = series(checkIns, (c) => c.entries.sleep as number | undefined);

  const effects = new Map<string, { count: number; last: string }>();
  for (const c of checkIns) {
    for (const e of (c.entries.glp1 as { side_effects?: string[] } | undefined)?.side_effects ?? []) {
      const k = e.toLowerCase().trim();
      const prev = effects.get(k);
      effects.set(k, { count: (prev?.count ?? 0) + 1, last: !prev || c.date > prev.last ? c.date : prev.last });
    }
  }
  const effectRows = [...effects.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, v]) => ({ label, count: v.count, detail: `Last mentioned ${new Date(v.last).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` }));

  const last28 = checkIns.filter((c) => Date.now() - new Date(c.date).getTime() < 28 * DAY);
  const activeDays = new Set(last28.map((c) => new Date(c.date).toDateString())).size;

  const wDelta = weight.length >= 2 ? weight[weight.length - 1].value - weight[0].value : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Your patterns</h2>

      {weight.length >= 2 && (
        <Card title="Weight" icon={Scale} tone="sky">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
            <span className="whitespace-nowrap font-display text-4xl font-semibold">{wDelta <= 0 ? "↓" : "↑"} {Math.abs(Math.round(wDelta * 10) / 10)} lbs</span>
            <span className="text-sm text-muted">since {new Date(weight[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · now {weight[weight.length - 1].value} lbs</span>
          </div>
          <LineChart points={weight} unit=" lbs" />
          <p className="mt-2 text-xs text-muted">Weight is one measure of progress, not the only one. Day-to-day ups and downs are normal.</p>
        </Card>
      )}

      <Card icon={CalendarDays} tone="peach" title="Check-in rhythm" subtitle={`You checked in on ${activeDays} of the last 28 days.`}>
        <CheckInCalendar dates={checkIns.map((c) => c.date)} />
      </Card>

      {mood.length >= 2 && (
        <Card icon={Smile} tone="peach" title="Mood" subtitle="How you've been feeling, from your check-ins">
          <LineChart points={mood} yDomain={[1, 5]} yTicks={[1, 3, 5]} yTickLabel={(v) => MOOD_LABELS[Math.round(v)] ?? String(v)} />
        </Card>
      )}

      {effectRows.length > 0 && (
        <Card icon={Pill} tone="lavender" title="GLP-1 side effects" subtitle="How often each came up in your check-ins. Worth sharing with your care team.">
          <CountBars rows={effectRows} />
        </Card>
      )}

      {water.length >= 2 && (
        <Card icon={Droplets} tone="sky" title="Water" subtitle="Cups per day">
          <LineChart points={water} unit=" cups" height={130} />
        </Card>
      )}

      {sleep.length >= 2 && (
        <Card icon={Moon} tone="lavender" title="Sleep" subtitle="Hours per night">
          <LineChart points={sleep} unit=" hrs" height={130} />
        </Card>
      )}
    </section>
  );
}

export default function History() {
  const [checkIns, setCheckIns] = useState<CheckIn[] | null>(null);

  useEffect(() => {
    fetch("/api/checkins").then((r) => r.json()).then(setCheckIns);
  }, []);

  if (!checkIns) return <p className="text-muted">Gathering your check-ins…</p>;

  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length === 0) {
    return (
      <div className="space-y-3 rounded-3xl border border-line bg-card p-6 text-center shadow-soft">
        <div className="flex justify-center"><IconTile icon={BookOpen} tone="peach" size="lg" /></div>
        <h1 className="text-xl font-semibold">No check-ins yet</h1>
        <p className="text-sm text-muted">Your check-ins will show up here so you can look back on how far you&apos;ve come.</p>
        <Link href="/" className="inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-soft">Check in now</Link>
      </div>
    );
  }

  const lastWeek = sorted.filter((c) => Date.now() - new Date(c.date).getTime() < 7 * DAY);
  const moods = lastWeek.map((c) => (c.entries.mood as { score?: number } | undefined)?.score).filter((m): m is number => m != null);
  const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : null;

  const groups: [string, CheckIn[]][] = [];
  for (const c of sorted) {
    const label = groupLabel(c.date);
    const g = groups.find(([l]) => l === label);
    if (g) g[1].push(c);
    else groups.push([label, [c]]);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold">Your journey</h1>
        <p className="mt-2 flex items-start gap-2 text-accent-strong"><Heart size={18} className="mt-0.5 shrink-0" fill="currentColor" aria-hidden /> Look how often you&apos;ve shown up for yourself.</p>
      </section>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-3xl border border-line bg-card p-3 shadow-soft">
          <p className="font-display text-3xl font-semibold">{sorted.length}</p>
          <p className="text-xs text-muted">check-ins total</p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-3 shadow-soft">
          <p className="font-display text-3xl font-semibold">{lastWeek.length}</p>
          <p className="text-xs text-muted">in the last 7 days</p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-3 shadow-soft">
          <p className="font-display text-3xl font-semibold">{avgMood ?? "–"}</p>
          <p className="text-xs text-muted">avg mood, last 7 days</p>
        </div>
      </section>

      <Patterns checkIns={sorted} />

      <h2 className="pt-2 text-xl font-semibold">Every check-in</h2>
      {groups.map(([label, items]) => (
        <section key={label}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</h3>
          <div className="space-y-3">{items.map((c) => <CheckInCard key={c.id} checkIn={c} />)}</div>
        </section>
      ))}
    </div>
  );
}
