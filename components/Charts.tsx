"use client";
import { useEffect, useRef, useState } from "react";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export type Point = { date: string; value: number; note?: string };

// Single-series line chart with crosshair + tooltip. Inline SVG, no dependencies.
export function LineChart({
  points,
  unit = "",
  yDomain,
  yTickLabel = (v: number) => String(v),
  yTicks,
  height = 160,
}: {
  points: Point[];
  unit?: string;
  yDomain?: [number, number];
  yTickLabel?: (v: number) => string;
  yTicks?: number[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the container's real pixel width so axis text stays legible on phones.
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(360);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height, L = 52, R = 12, T = 12, B = 24;

  const xs = points.map((p) => new Date(p.date).getTime());
  const vals = points.map((p) => p.value);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs) || 1];
  let [y0, y1] = yDomain ?? [Math.min(...vals), Math.max(...vals)];
  if (!yDomain) {
    const pad = Math.max(1, (y1 - y0) * 0.2);
    y0 = Math.floor(y0 - pad);
    // Two equal integer steps so the three ticks are evenly spaced.
    const step = Math.ceil((Math.ceil(y1 + pad) - y0) / 2);
    y1 = y0 + 2 * step;
  }
  const ticks = yTicks ?? [y0, (y0 + y1) / 2, y1];
  const sx = (t: number) => L + (x1 === x0 ? (W - L - R) / 2 : ((t - x0) / (x1 - x0)) * (W - L - R));
  const sy = (v: number) => T + (1 - (v - y0) / (y1 - y0 || 1)) * (H - T - B);
  const path = points.map((p, i) => `${i ? "L" : "M"}${sx(xs[i])},${sy(p.value)}`).join(" ");
  const area = `${path} L${sx(xs[xs.length - 1])},${H - B} L${sx(xs[0])},${H - B} Z`;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    xs.forEach((t, i) => { if (Math.abs(sx(t) - x) < Math.abs(sx(xs[best]) - x)) best = i; });
    setHover(best);
  };

  const h = hover != null ? points[hover] : null;
  const last = points[points.length - 1];

  return (
    <div ref={wrap} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block w-full" role="img"
        aria-label={`Line chart, ${points.length} points from ${fmtDate(points[0].date)} to ${fmtDate(last.date)}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 8} y={sy(t)} dy="0.35em" textAnchor="end" fontSize={12} fill="var(--muted)">{yTickLabel(t)}</text>
          </g>
        ))}
        <text x={L} y={H - 6} fontSize={12} fill="var(--muted)">{fmtDate(points[0].date)}</text>
        <text x={W - R} y={H - 6} fontSize={12} fill="var(--muted)" textAnchor="end">{fmtDate(last.date)}</text>
        <path d={area} fill="var(--accent)" opacity={0.1} />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {h && <line x1={sx(xs[hover!])} x2={sx(xs[hover!])} y1={T} y2={H - B} stroke="var(--muted)" strokeWidth={1} />}
        {points.map((p, i) => (
          <circle key={i} cx={sx(xs[i])} cy={sy(p.value)} r={hover === i ? 6 : 4} fill="var(--accent)" stroke="var(--card)" strokeWidth={2} />
        ))}
        <rect x={L} y={0} width={W - L - R} height={H} fill="transparent"
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-lg border border-line bg-card px-2 py-1 text-xs shadow-sm"
          style={{ left: `${(sx(xs[hover!]) / W) * 100}%`, transform: `translateX(${sx(xs[hover!]) > W * 0.7 ? "-100%" : "8px"})` }}>
          <div className="text-muted">{fmtDate(h.date)}</div>
          <div className="font-medium">{yTickLabel(h.value)}{unit}</div>
          {h.note && <div className="max-w-40 text-muted">{h.note}</div>}
        </div>
      )}
    </div>
  );
}

// Last N weeks as a calendar grid; filled days had a check-in.
export function CheckInCalendar({ dates, weeks = 4 }: { dates: string[]; weeks?: number }) {
  const days = new Set(dates.map((d) => new Date(d).toDateString()));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
        {cells.map((d) => {
          const on = days.has(d.toDateString());
          const future = d > today;
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={d.toISOString()} title={`${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${on ? ": checked in" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-md text-[10px] ${on ? "bg-accent text-white" : future ? "bg-transparent text-line" : "bg-background text-muted"} ${isToday ? "ring-2 ring-accent ring-offset-1" : ""}`}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal bars for counts (e.g. how often each side effect came up).
export function CountBars({ rows }: { rows: { label: string; count: number; detail?: string }[] }) {
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} title={r.detail} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm">
          <span className="truncate capitalize">{r.label}</span>
          <div className="h-4">
            <div className="h-full rounded-r bg-accent" style={{ width: `${(r.count / max) * 100}%`, minWidth: 6 }} />
          </div>
          <span className="w-12 text-right text-xs text-muted">{r.count}×</span>
        </div>
      ))}
    </div>
  );
}
