"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckInCard from "@/components/CheckInCard";
import QuickLog from "@/components/QuickLog";
import TextCheckin from "@/components/TextCheckin";
import VoiceCheckin from "@/components/VoiceCheckin";
import { CalendarHeart, ChevronRight, Heart, Moon, Sparkles, Sun, Sunrise, Target } from "lucide-react";
import { splitGoals } from "@/lib/goals";
import { CADENCES, MODES, TRACKING_ITEMS } from "@/lib/tracking";
import type { CheckIn, Mode, Profile } from "@/lib/types";

const EVERYDAY_ENCOURAGEMENT = [
  "Every check-in is a small act of care for yourself.",
  "Progress isn't a straight line, and showing up still counts.",
  "You don't have to be perfect. You just have to keep going, and you are.",
  "Small steps, repeated, add up to big change.",
  "Be as kind to yourself today as you would be to a good friend.",
  "Noticing how you feel is a skill, and you're building it.",
  "You've been working on this for a long time. That takes real strength.",
];

// A warm line that reflects the patient's own recent check-ins when possible.
function encouragement(profile: Profile, sorted: CheckIn[]) {
  const last = sorted[0];
  if (!last) return "Welcome. Starting is often the hardest part, and you're already here.";

  const daysSince = Math.floor((Date.now() - new Date(last.date).getTime()) / 86_400_000);
  const cadenceDays = CADENCES.find((c) => c.id === profile.cadence)?.days ?? 7;
  if (daysSince > cadenceDays * 2) return "Welcome back. No catching up needed; today is a fresh start.";

  const mood = (last.entries.mood as { score?: number } | undefined)?.score;
  if (mood != null && mood <= 2) return "Last time felt hard. Be gentle with yourself today. You're not doing this alone.";

  const win = (last.entries.wins as { wins?: string[] } | undefined)?.wins?.[0];
  if (win) return `Last time you shared a win: "${win}". That's worth celebrating.`;

  const thisWeek = sorted.filter((c) => Date.now() - new Date(c.date).getTime() < 7 * 86_400_000).length;
  if (thisWeek >= 3) return `${thisWeek} check-ins this week. You keep showing up for yourself, and it matters.`;

  const day = Math.floor(Date.now() / 86_400_000);
  return EVERYDAY_ENCOURAGEMENT[day % EVERYDAY_ENCOURAGEMENT.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sunrise };
  if (h < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

function nextCheckInLabel(profile: Profile, last?: CheckIn) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (last && new Date(last.date) >= today) return "You've already checked in today. Nice work.";
  const days = CADENCES.find((c) => c.id === profile.cadence)?.days;
  if (days == null) return "Check in whenever it feels right";
  if (!last) return "Your first check-in starts today";
  const due = new Date(last.date);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + days);
  if (due <= today) return "Today's a good day to check in";
  return `Next check-in ${due.toLocaleDateString(undefined, { weekday: "long" })}, but anytime is welcome`;
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [mode, setMode] = useState<Mode>("voice");
  const [latestId, setLatestId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await fetch("/api/profile").then((r) => r.json());
      if (!p) return router.push("/onboarding");
      setProfile(p);
      setMode(p.preferredMode);
      setCheckIns(await fetch("/api/checkins").then((r) => r.json()));
    })();
  }, [router]);

  if (!profile) return <p className="text-muted">Loading…</p>;

  const tracked = TRACKING_ITEMS.filter((i) => profile.trackingItems.includes(i.id));
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];
  const lastFollowUp = sorted.find((c) => c.followUp)?.followUp ?? "";

  const added = (c: CheckIn) => {
    setCheckIns((s) => [...s, c]);
    setLatestId(c.id);
  };
  const extract = async (text: string, m: Mode) => {
    const r = await fetch("/api/extract", { method: "POST", body: JSON.stringify({ text, mode: m }) });
    if (!r.ok) return alert("Sorry, we couldn't save that check-in. Please try again.");
    added(await r.json());
  };
  const saveQuick = async (entries: Record<string, unknown>) =>
    added(await fetch("/api/checkins", { method: "POST", body: JSON.stringify({ entries, mode: "quick" }) }).then((r) => r.json()));

  const latest = sorted.find((c) => c.id === latestId);

  const hello = greeting();
  const goals = splitGoals(profile.dietitianGoals);
  const firstName = profile.name.trim().split(/\s+/)[0];

  return (
    <div className="space-y-5">
      <section className="animate-rise">
        <p className="flex items-center gap-1.5 text-sm text-muted"><hello.icon size={16} aria-hidden /> {hello.text}</p>
        <h1 className="text-3xl font-semibold">{firstName}, how are you today?</h1>
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-accent-soft/70 p-3.5">
          <Heart size={18} className="mt-0.5 shrink-0 text-accent" fill="currentColor" aria-hidden />
          <p className="text-[15px] leading-snug text-accent-strong">{encouragement(profile, sorted)}</p>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <CalendarHeart size={15} aria-hidden /> {nextCheckInLabel(profile, last)}
        </p>
      </section>

      {goals.length > 0 && (
        <Link href="/goals" className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-soft">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage"><Target size={18} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage">You&apos;re working on</p>
            <p className="truncate text-sm">{goals.join(" · ")}</p>
          </div>
          <ChevronRight size={18} className="text-muted" aria-hidden />
        </Link>
      )}

      <section className="rounded-3xl border border-line bg-card p-4 shadow-soft">
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-background p-1">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-sm transition sm:flex-row sm:justify-center sm:gap-2 ${mode === m.id ? "bg-card font-semibold text-accent-strong shadow-soft" : "text-muted"}`}>
              <m.icon size={18} strokeWidth={2} aria-hidden /> {m.label}
            </button>
          ))}
        </div>
        <p className="mb-2 text-center text-xs text-muted">{MODES.find((m) => m.id === mode)?.hint}</p>
        {mode === "voice" && (
          <VoiceCheckin
            onDone={(t) => extract(t, "voice")}
            dynamicVariables={{
              patient_name: profile.name,
              dietitian_name: profile.dietitianName || "your dietitian",
              dietitian_goals: profile.dietitianGoals || "none set yet",
              tracking_topics: tracked.map((i) => i.promptHint).join("; "),
              last_followup: lastFollowUp || "This is our first check-in.",
            }}
          />
        )}
        {mode === "text" && <TextCheckin topics={tracked.map((i) => i.label.toLowerCase())} onSubmit={(t) => extract(t, "text")} />}
        {mode === "quick" && <QuickLog items={profile.trackingItems} goals={goals} onSave={saveQuick} />}
      </section>

      {latest && (
        <section className="animate-rise space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={18} className="text-honey" aria-hidden />
            <h2 className="text-lg font-semibold">Thank you for checking in, {firstName}</h2>
          </div>
          <CheckInCard checkIn={latest} highlight />
        </section>
      )}

      {sorted.length > 0 && (
        <Link href="/history" className="flex items-center justify-center gap-1 text-sm text-muted hover:text-foreground">
          Look back at your {sorted.length} check-ins <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
