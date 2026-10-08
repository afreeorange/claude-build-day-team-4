import { HeartHandshake, ListChecks, MessageCircleHeart, Mic, PenLine, Target } from "lucide-react";
import { itemById } from "@/lib/tracking";
import { IconTile } from "@/lib/ui";
import type { CheckIn } from "@/lib/types";

type Meal = { time?: string; description: string; hunger_before?: number; fullness_after?: number };

function lines(id: string, v: unknown): string[] {
  if (v == null) return [];
  if (id === "meals" && Array.isArray(v)) {
    return v.map((m: Meal | string) => {
      if (typeof m === "string") return m;
      const cues = [
        m.hunger_before != null && `hunger ${m.hunger_before}/10`,
        m.fullness_after != null && `fullness ${m.fullness_after}/10`,
      ].filter(Boolean);
      return `${m.time ? m.time + ": " : ""}${m.description}${cues.length ? ` (${cues.join(", ")})` : ""}`;
    });
  }
  if (id === "glp1" && !Array.isArray(v) && typeof v === "object") {
    const g = v as { taken?: boolean; side_effects?: string[] };
    return [
      g.taken === true ? "Took medication" : g.taken === false ? "Did not take medication" : "",
      g.side_effects?.length ? `Side effects: ${g.side_effects.join(", ")}` : g.side_effects ? "No side effects" : "",
    ].filter(Boolean);
  }
  if (id === "mood" && typeof v === "object" && !Array.isArray(v)) {
    const m = v as { score?: number; note?: string };
    return [[m.score ? `${m.score}/5` : "", m.note].filter(Boolean).join(": ")];
  }
  if (id === "wins" && typeof v === "object" && !Array.isArray(v)) {
    const w = v as { wins?: string[]; struggles?: string[] };
    return [...(w.wins ?? []).map((x) => `✓ ${x}`), ...(w.struggles ?? []).map((x) => `Tough: ${x}`)];
  }
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "number") return [`${v} ${itemById(id)?.quick.kind === "number" ? (itemById(id)!.quick as { unit: string }).unit : ""}`];
  return [String(v)];
}

const MODE = {
  voice: { label: "Voice", icon: Mic },
  text: { label: "Written", icon: PenLine },
  quick: { label: "Quick tap", icon: ListChecks },
};

function Row({ tile, label, values }: { tile: React.ReactNode; label: string; values: string[] }) {
  return (
    <div className="flex gap-3">
      {tile}
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="text-[15px] leading-snug">{values.map((x, i) => <div key={i}>{x}</div>)}</dd>
      </div>
    </div>
  );
}

export default function CheckInCard({ checkIn, highlight }: { checkIn: CheckIn; highlight?: boolean }) {
  const d = new Date(checkIn.date);
  const mode = MODE[checkIn.mode];
  return (
    <div className={`rounded-3xl border bg-card p-4 shadow-soft ${highlight ? "border-accent/40" : "border-line"}`}>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="font-semibold">{d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5"><mode.icon size={12} aria-hidden /> {mode.label}</span>
      </div>
      {checkIn.redFlags.length > 0 && <RedFlagBanner flags={checkIn.redFlags} />}
      {checkIn.summary && <p className="mb-4 font-display text-lg leading-snug">{checkIn.summary}</p>}
      <dl className="grid gap-3">
        {Array.isArray(checkIn.entries.goals) && checkIn.entries.goals.length > 0 && (
          <Row tile={<IconTile icon={Target} tone="sage" size="sm" />} label="Goals" values={(checkIn.entries.goals as string[]).map((g) => `✓ ${g}`)} />
        )}
        {Object.entries(checkIn.entries).map(([id, v]) => {
          const item = itemById(id);
          const l = lines(id, v).filter(Boolean);
          if (!item || l.length === 0) return null;
          return <Row key={id} tile={<IconTile icon={item.icon} tone={item.tone} size="sm" />} label={item.label} values={l} />;
        })}
      </dl>
      {checkIn.followUp && highlight && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-accent-soft/70 px-3 py-2.5 text-sm text-accent-strong">
          <MessageCircleHeart size={18} className="shrink-0" aria-hidden /> <span>Next time I&apos;ll ask: {checkIn.followUp}</span>
        </p>
      )}
    </div>
  );
}

export function RedFlagBanner({ flags }: { flags: string[] }) {
  return (
    <div className="mb-4 rounded-2xl border border-rose/30 bg-rose-soft p-3.5 text-sm text-[#7a2e3e]">
      <p className="flex items-center gap-2 font-semibold"><HeartHandshake size={18} aria-hidden /> We care about you. Please reach out to your care team.</p>
      <ul className="my-2 list-disc pl-6">{flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
      <p>Please contact your care team today. If it&apos;s an emergency, call <b>911</b>. If you&apos;re having thoughts of harming yourself, call or text <b>988</b>. You don&apos;t have to go through this alone.</p>
    </div>
  );
}
