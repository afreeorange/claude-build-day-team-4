"use client";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

const STARTERS = ["Today I ate…", "I'm feeling…", "Something that went well…", "Something that was hard…"];

export default function TextCheckin({ topics, onSubmit }: { topics: string[]; onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Write however feels natural. There&apos;s no wrong way to do this. You might mention {topics.join(", ")}.</p>
      <div className="flex flex-wrap gap-1.5">
        {STARTERS.map((s) => (
          <button key={s} onClick={() => setText((t) => (t ? `${t.trimEnd()}\n${s} ` : `${s} `))}
            className="rounded-full bg-background px-3 py-1 text-xs text-muted hover:text-foreground">{s}</button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
        placeholder="Dear journal…"
        className="w-full rounded-2xl border border-line bg-background/60 p-3.5 text-[15px] leading-relaxed outline-none focus:border-accent focus:bg-card" />
      <button disabled={busy || !text.trim()} onClick={async () => { setBusy(true); await onSubmit(text); setText(""); setBusy(false); }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-white shadow-soft transition hover:bg-accent-strong disabled:opacity-40">
        {busy ? <><Loader2 size={18} className="animate-spin" /> Reading your entry…</> : <><Send size={17} /> Save my entry</>}
      </button>
    </div>
  );
}
