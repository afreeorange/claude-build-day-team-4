"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarDays, Check, CircleHelp, Feather, Pill, Plus, Sprout, Sun, X } from "lucide-react";
import { COMMON_GOALS, splitGoals } from "@/lib/goals";
import { IconTile, type Tone } from "@/lib/ui";
import { CADENCES, MODES, TRACKING_ITEMS } from "@/lib/tracking";
import type { Glp1Status, Profile } from "@/lib/types";

const GLP1_OPTIONS: { id: Glp1Status; label: string; detail: string; icon: typeof Pill; tone: Tone }[] = [
  { id: "yes", label: "Yes, I'm taking one", detail: "We'll help you track when you take it and any side effects", icon: Pill, tone: "lavender" },
  { id: "considering", label: "Not yet, but I'm considering it", detail: "You can ask questions about it anytime in Ask", icon: CircleHelp, tone: "sky" },
  { id: "no", label: "No", detail: "No problem, we'll leave medication tracking out", icon: X, tone: "sage" },
];

const CADENCE_ICONS = { daily: { icon: Sun, tone: "honey" }, "3x": { icon: CalendarDays, tone: "peach" }, weekly: { icon: CalendarCheck, tone: "sage" }, flexible: { icon: Feather, tone: "lavender" } } as const;

const GLP1_MEDS = ["Wegovy / Ozempic (semaglutide)", "Zepbound / Mounjaro (tirzepatide)", "Other", "Not sure"];

const DEFAULT: Profile = {
  name: "",
  trackingItems: ["meals", "mood"],
  cadence: "3x",
  preferredMode: "voice",
  dietitianName: "",
  dietitianGoals: "",
};

export default function Onboarding() {
  const router = useRouter();
  const [p, setP] = useState<Profile>(DEFAULT);
  const [step, setStep] = useState(0);
  const [customGoal, setCustomGoal] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((existing) => existing && setP(existing));
  }, []);

  const toggle = (id: string) =>
    setP((s) => ({ ...s, trackingItems: s.trackingItems.includes(id) ? s.trackingItems.filter((x) => x !== id) : [...s.trackingItems, id] }));

  const setGlp1 = (status: Glp1Status) =>
    setP((s) => ({
      ...s,
      glp1Status: status,
      glp1Medication: status === "yes" ? s.glp1Medication : undefined,
      trackingItems: status === "yes"
        ? [...new Set([...s.trackingItems, "glp1"])]
        : s.trackingItems.filter((x) => x !== "glp1"),
    }));

  const goals = splitGoals(p.dietitianGoals);
  const setGoals = (g: string[]) => setP((s) => ({ ...s, dietitianGoals: g.join("; ") }));
  const toggleGoal = (g: string) => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g]);
  const addCustomGoal = () => {
    const g = customGoal.trim().replace(/;/g, ",");
    if (g && !goals.includes(g)) setGoals([...goals, g]);
    setCustomGoal("");
  };

  const save = async () => {
    await fetch("/api/profile", { method: "POST", body: JSON.stringify(p) });
    router.push("/");
  };

  const card = (on: boolean) =>
    `flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${on ? "border-accent bg-accent-soft/60 shadow-soft" : "border-line bg-card hover:border-accent/40"}`;
  const Tick = ({ on }: { on: boolean }) => (
    <span className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-accent bg-accent text-white" : "border-line"}`}>
      {on && <Check size={14} strokeWidth={3} />}
    </span>
  );
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-accent bg-accent text-white shadow-soft" : "border-line bg-card hover:border-accent/40"}`;
  const field = "w-full rounded-2xl border border-line bg-card p-3.5 outline-none focus:border-accent";
  const first = p.name.trim().split(/\s+/)[0] || "friend";

  const steps = [
    {
      title: "We're so glad you're here",
      body: (
        <div className="space-y-4">
          <p className="text-muted">Alongside is your companion between visits: a place to check in, notice patterns, celebrate small wins, and ask questions. It works with your care team, never instead of them.</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">What should we call you?</span>
            <input placeholder="Your first name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Who&apos;s your dietitian? <span className="font-normal text-muted">(optional)</span></span>
            <input placeholder="e.g. Jen" value={p.dietitianName} onChange={(e) => setP({ ...p, dietitianName: e.target.value })} className={field} />
          </label>
        </div>
      ),
      ok: p.name.trim().length > 0,
    },
    {
      title: `Are you taking a GLP-1 medication, ${first}?`,
      body: (
        <div className="space-y-2.5">
          <p className="text-sm text-muted">For example Wegovy, Ozempic, Zepbound or Mounjaro. This helps us ask the right questions, and it stays between you and your care team.</p>
          {GLP1_OPTIONS.map((o) => (
            <button key={o.id} onClick={() => setGlp1(o.id)} className={card(p.glp1Status === o.id)}>
              <IconTile icon={o.icon} tone={o.tone} />
              <div>
                <div className="font-semibold">{o.label}</div>
                <div className="text-xs text-muted">{o.detail}</div>
              </div>
              <Tick on={p.glp1Status === o.id} />
            </button>
          ))}
          {p.glp1Status === "yes" && (
            <div className="animate-rise pt-2">
              <p className="mb-2 text-sm font-semibold">Which one? <span className="font-normal text-muted">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {GLP1_MEDS.map((m) => (
                  <button key={m} onClick={() => setP({ ...p, glp1Medication: p.glp1Medication === m ? undefined : m })} className={chip(p.glp1Medication === m)}>
                    {p.glp1Medication === m && <Check size={14} strokeWidth={2.5} />}{m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      ok: p.glp1Status != null,
    },
    {
      title: "What are you working on?",
      body: (
        <div className="space-y-4">
          <p className="text-sm text-muted">Pick any goals you&apos;ve set with {p.dietitianName || "your dietitian"}, or add your own. Small goals count, and you can change these anytime.</p>
          <div className="flex flex-wrap gap-2">
            {[...COMMON_GOALS, ...goals.filter((g) => !COMMON_GOALS.includes(g))].map((g) => {
              const on = goals.includes(g);
              return (
                <button key={g} onClick={() => toggleGoal(g)} className={chip(on)}>
                  {on && <Check size={14} strokeWidth={2.5} />}{g}
                </button>
              );
            })}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); addCustomGoal(); }} className="flex gap-2">
            <input placeholder="Write your own goal…" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} className={`flex-1 ${field}`} />
            <button disabled={!customGoal.trim()} aria-label="Add goal" className="flex items-center gap-1 rounded-2xl border border-accent px-4 font-semibold text-accent disabled:opacity-40">
              <Plus size={18} /> Add
            </button>
          </form>
        </div>
      ),
      ok: true,
    },
    {
      title: "What would you like to keep track of?",
      body: (
        <div className="space-y-3">
          <p className="text-sm text-muted">Choose only what feels helpful. Less is often more.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRACKING_ITEMS.filter((i) => i.id !== "glp1" || p.glp1Status === "yes").map((i) => {
              const on = p.trackingItems.includes(i.id);
              return (
                <button key={i.id} onClick={() => toggle(i.id)} className={card(on)}>
                  <IconTile icon={i.icon} tone={i.tone} />
                  <div className="min-w-0">
                    <div className="font-semibold">{i.label}</div>
                    <div className="text-xs text-muted">{i.description}</div>
                  </div>
                  <Tick on={on} />
                </button>
              );
            })}
          </div>
        </div>
      ),
      ok: p.trackingItems.length > 0,
    },
    {
      title: "How often would you like to check in?",
      body: (
        <div className="space-y-2.5">
          <p className="text-sm text-muted">There&apos;s no right answer. Pick what feels sustainable for you. You can change it anytime.</p>
          {CADENCES.map((c) => {
            const ic = CADENCE_ICONS[c.id];
            return (
              <button key={c.id} onClick={() => setP({ ...p, cadence: c.id })} className={card(p.cadence === c.id)}>
                <IconTile icon={ic.icon} tone={ic.tone} />
                <span className="font-semibold">{c.label}</span>
                <Tick on={p.cadence === c.id} />
              </button>
            );
          })}
        </div>
      ),
      ok: true,
    },
    {
      title: "How do you like to check in?",
      body: (
        <div className="space-y-2.5">
          <p className="text-sm text-muted">This will be your default. You can always switch, any day.</p>
          {MODES.map((m, i) => (
            <button key={m.id} onClick={() => setP({ ...p, preferredMode: m.id })} className={card(p.preferredMode === m.id)}>
              <IconTile icon={m.icon} tone={(["peach", "honey", "sage"] as const)[i]} />
              <div>
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-muted">{m.hint}</div>
              </div>
              <Tick on={p.preferredMode === m.id} />
            </button>
          ))}
        </div>
      ),
      ok: true,
    },
  ];

  const s = steps[step];
  const last = step === steps.length - 1;
  return (
    <div className="space-y-5">
      {step === 0 && (
        <div className="flex justify-center pt-2"><IconTile icon={Sprout} tone="sage" size="lg" /></div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">{steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-accent" : "bg-line"}`} />)}</div>
        <span className="text-xs text-muted">{step + 1} of {steps.length}</span>
      </div>
      <h1 key={step} className="animate-rise text-2xl font-semibold leading-tight">{s.title}</h1>
      <div key={`b${step}`} className="animate-rise">{s.body}</div>
      <div className="flex gap-2 pt-1">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} aria-label="Back" className="flex items-center justify-center rounded-full border border-line bg-card px-4 py-3.5 text-muted">
            <ArrowLeft size={18} />
          </button>
        )}
        <button disabled={!s.ok} onClick={() => { if (customGoal.trim()) addCustomGoal(); if (!last) setStep(step + 1); else save(); }}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-white shadow-soft transition hover:bg-accent-strong disabled:opacity-40">
          {last ? <>Let&apos;s begin <Sprout size={18} /></> : <>Continue <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
