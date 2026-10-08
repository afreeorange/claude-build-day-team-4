"use client";
import { useState } from "react";
import { Annoyed, Check, Frown, Laugh, Loader2, Meh, Smile, Target } from "lucide-react";
import { TRACKING_ITEMS } from "@/lib/tracking";
import { IconTile } from "@/lib/ui";

const MOOD_FACES = [Frown, Annoyed, Meh, Smile, Laugh];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-accent bg-accent text-white shadow-soft" : "border-line bg-card hover:border-accent/50"}`}>
      {on && <Check size={14} strokeWidth={2.5} aria-hidden />}{children}
    </button>
  );
}

export default function QuickLog({ items, goals = [], onSave }: { items: string[]; goals?: string[]; onSave: (entries: Record<string, unknown>) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const set = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));

  const save = async () => {
    setSaving(true);
    // Normalize into the same shapes the extractor produces.
    const entries: Record<string, unknown> = {};
    for (const [id, v] of Object.entries(values)) {
      if (v === "" || v == null || (Array.isArray(v) && v.length === 0)) continue;
      if (id === "mood") entries.mood = { score: v };
      else if (id === "glp1") {
        const chips = v as string[];
        entries.glp1 = {
          taken: chips.includes("Took my dose") || undefined,
          side_effects: chips.filter((c) => c !== "Took my dose" && c !== "No side effects"),
        };
      } else if (id === "wins") entries.wins = { wins: [v as string] };
      else entries[id] = v;
    }
    await onSave(entries);
    setValues({});
    setSaving(false);
  };

  const pickedGoals = (values.goals as string[]) ?? [];
  const field = "rounded-xl border border-line bg-background/60 px-3 py-2.5 outline-none focus:border-accent focus:bg-card";
  return (
    <div className="space-y-5">
      {goals.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><IconTile icon={Target} tone="sage" size="sm" /> Goals I worked on</p>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <Chip key={g} on={pickedGoals.includes(g)} onClick={() => set("goals", pickedGoals.includes(g) ? pickedGoals.filter((x) => x !== g) : [...pickedGoals, g])}>{g}</Chip>
            ))}
          </div>
        </div>
      )}
      {TRACKING_ITEMS.filter((i) => items.includes(i.id)).map((item) => {
        const q = item.quick;
        const v = values[item.id];
        return (
          <div key={item.id}>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><IconTile icon={item.icon} tone={item.tone} size="sm" /> {item.label}</p>
            {q.kind === "chips" && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = ((v as string[]) ?? []).includes(o);
                  return <Chip key={o} on={on} onClick={() => set(item.id, on ? (v as string[]).filter((x) => x !== o) : [...((v as string[]) ?? []), o])}>{o}</Chip>;
                })}
              </div>
            )}
            {q.kind === "scale" && (
              <div className="flex items-end justify-between gap-1 sm:justify-start sm:gap-3">
                {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n, i) => {
                  const Face = MOOD_FACES[i] ?? Smile;
                  const on = v === n;
                  return (
                    <button key={n} onClick={() => set(item.id, n)} aria-pressed={on} aria-label={`${n} of ${q.max}`}
                      className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${on ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-background"}`}>
                      <Face size={30} strokeWidth={on ? 2.2 : 1.6} />
                      <span className="text-[11px]">{i === 0 ? q.labels[0] : i === q.max - q.min ? q.labels[1] : "\u00a0"}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {q.kind === "number" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="number" inputMode="decimal" value={(v as number) ?? ""} onChange={(e) => set(item.id, e.target.value === "" ? "" : Number(e.target.value))}
                  className={`w-28 ${field}`} />
                <span className="text-muted">{q.unit}</span>
              </label>
            )}
            {q.kind === "text" && (
              <input value={(v as string) ?? ""} onChange={(e) => set(item.id, e.target.value)} placeholder={q.placeholder}
                className={`w-full text-sm ${field}`} />
            )}
          </div>
        );
      })}
      <button onClick={save} disabled={saving || Object.keys(values).length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-white shadow-soft transition hover:bg-accent-strong disabled:opacity-40">
        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <><Check size={18} strokeWidth={2.5} /> Save check-in</>}
      </button>
    </div>
  );
}
