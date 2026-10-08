import type { LucideIcon } from "lucide-react";

export type Tone = "peach" | "sage" | "honey" | "sky" | "lavender" | "rose";

export const TONES: Record<Tone, { bg: string; fg: string }> = {
  peach: { bg: "bg-accent-soft", fg: "text-accent" },
  sage: { bg: "bg-sage-soft", fg: "text-sage" },
  honey: { bg: "bg-honey-soft", fg: "text-honey" },
  sky: { bg: "bg-sky-soft", fg: "text-sky" },
  lavender: { bg: "bg-lavender-soft", fg: "text-lavender" },
  rose: { bg: "bg-rose-soft", fg: "text-rose" },
};

// A line icon sitting on a soft pastel tile. Used everywhere instead of emoji.
export function IconTile({ icon: Icon, tone = "peach", size = "md" }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const box = { sm: "h-7 w-7 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-14 w-14 rounded-2xl" }[size];
  const px = { sm: 15, md: 20, lg: 28 }[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${TONES[tone].bg} ${TONES[tone].fg}`}>
      <Icon size={px} strokeWidth={1.9} aria-hidden />
    </span>
  );
}
