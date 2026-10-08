"use client";
import { useState } from "react";
import { BookMarked, LifeBuoy, MessageCircleQuestion, Send, Sprout } from "lucide-react";
import { IconTile } from "@/lib/ui";

type Segment = { text: string; citations: { title: string | null; quote: string }[] };

const SUGGESTED = [
  "Why do I feel full so fast?",
  "What can I eat when I'm nauseous?",
  "How do I deal with constipation?",
  "Should I increase my dose?",
  "What should I eat before my knee surgery?",
];

export default function Ask() {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim()) return;
    setBusy(true);
    setAsked(question);
    setSegments(null);
    setQ("");
    const r = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question }) });
    setSegments(r.ok ? (await r.json()).segments : [{ text: "Sorry, something went wrong. Please try again.", citations: [] }]);
    setBusy(false);
  };

  let n = 0;
  const cites: { n: number; title: string | null; quote: string }[] = [];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <IconTile icon={MessageCircleQuestion} tone="sky" size="lg" />
        <div>
          <h1 className="text-3xl font-semibold">Ask anything</h1>
          <p className="mt-1 text-sm text-muted">No question is too small. Answers come only from trusted references your care team has reviewed. For medication doses, your prescriber is the best person to ask.</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(q); }}
        className="flex items-center gap-2 rounded-full border border-line bg-card p-1.5 pl-4 shadow-soft focus-within:border-accent">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about food, side effects, recovery…" className="min-w-0 flex-1 bg-transparent py-2 outline-none" />
        <button disabled={busy || !q.trim()} aria-label="Ask" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong disabled:opacity-40">
          <Send size={17} />
        </button>
      </form>

      {!asked && <p className="text-xs font-semibold uppercase tracking-wide text-muted">People often ask</p>}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => ask(s)} disabled={busy}
            className="rounded-full border border-line bg-card px-3.5 py-2 text-sm transition hover:border-accent/50 disabled:opacity-50">{s}</button>
        ))}
      </div>

      {asked && (
        <div className="animate-rise space-y-3">
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-3xl rounded-br-md bg-accent-soft px-4 py-2.5">{asked}</p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage"><Sprout size={16} aria-hidden /></span>
            <div className="min-w-0 flex-1 rounded-3xl rounded-tl-md border border-line bg-card p-4 shadow-soft">
              {busy && (
                <p className="flex items-center gap-1.5 text-muted" aria-label="Thinking">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  <span className="ml-1 text-sm">Looking through your references…</span>
                </p>
              )}
              {segments && (
                <>
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {segments.map((s, i) => (
                      <span key={i}>
                        {s.text}
                        {s.citations.map((c) => {
                          cites.push({ n: ++n, ...c });
                          return (
                            <span key={`${i}-${n}`} title={c.quote}
                              className="mx-0.5 rounded-full bg-sky-soft px-1.5 align-super text-[10px] font-bold text-sky">{n}</span>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                  {cites.length > 0 && (
                    <details className="group mt-4 border-t border-line pt-3 text-xs">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-sky">
                        <BookMarked size={14} aria-hidden /> Where this comes from ({cites.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                        {cites.map((c) => (
                          <div key={c.n} className="rounded-xl bg-background p-2.5">
                            <span className="font-semibold">[{c.n}] {c.title}</span>
                            <p className="mt-1 italic text-muted">&ldquo;{c.quote.trim()}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="flex gap-2 rounded-2xl bg-rose-soft/60 p-3 text-xs text-[#7a2e3e]">
        <LifeBuoy size={16} className="shrink-0" aria-hidden />
        <span>Not for emergencies. If you have severe symptoms, contact your care team or call 911. If you&apos;re struggling, you can call or text 988 anytime.</span>
      </p>
    </div>
  );
}
