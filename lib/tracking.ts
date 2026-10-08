import { Droplets, Footprints, Moon, Pill, Scale, Smile, Sparkles, Utensils, Mic, PenLine, ListChecks, type LucideIcon } from "lucide-react";
import type { Tone } from "./ui";

// Single registry of trackable items. Onboarding, quick log, the voice agent's
// topic list, and the extraction schema are all derived from this file.

export type QuickInput =
  | { kind: "scale"; min: number; max: number; labels: [string, string] }
  | { kind: "number"; unit: string }
  | { kind: "chips"; options: string[] }
  | { kind: "text"; placeholder: string };

export type TrackingItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  description: string;
  promptHint: string; // what the voice agent should gently ask about
  quick: QuickInput;
  schema: Record<string, unknown>; // JSON schema used when extracting from voice/text
};

export const TRACKING_ITEMS: TrackingItem[] = [
  {
    id: "meals",
    label: "Meals",
    icon: Utensils,
    tone: "honey",
    description: "What you ate, plus hunger and fullness cues",
    promptHint: "what they ate today and how hungry/full they felt",
    quick: { kind: "chips", options: ["Breakfast", "Lunch", "Dinner", "Snack", "Protein first", "Skipped a meal"] },
    schema: {
      type: "array",
      description: "Each meal or snack the patient mentioned",
      items: {
        type: "object",
        properties: {
          time: { type: "string", description: "e.g. 'breakfast', '8am'" },
          description: { type: "string" },
          hunger_before: { type: "integer", minimum: 1, maximum: 10 },
          fullness_after: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["description"],
      },
    },
  },
  {
    id: "glp1",
    label: "GLP-1 medication",
    icon: Pill,
    tone: "lavender",
    description: "Whether you took it and any side effects",
    promptHint: "whether they took their GLP-1 medication as scheduled and any side effects (never discuss doses)",
    quick: { kind: "chips", options: ["Took my dose", "Nausea", "Constipation", "Reflux", "Low appetite", "Fatigue", "No side effects"] },
    schema: {
      type: "object",
      properties: {
        taken: { type: "boolean", description: "Only if the patient said whether they took it" },
        side_effects: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    id: "mood",
    label: "Mood",
    icon: Smile,
    tone: "peach",
    description: "How you're feeling overall",
    promptHint: "how they're feeling emotionally today",
    quick: { kind: "scale", min: 1, max: 5, labels: ["Rough", "Great"] },
    schema: {
      type: "object",
      properties: {
        score: { type: "integer", minimum: 1, maximum: 5, description: "1 rough – 5 great, only if clearly expressed" },
        note: { type: "string" },
      },
    },
  },
  {
    id: "movement",
    label: "Movement",
    icon: Footprints,
    tone: "sage",
    description: "Walks, PT exercises, anything active",
    promptHint: "any movement, walking or PT exercises",
    quick: { kind: "chips", options: ["Walk", "PT exercises", "Stretching", "Pool", "Bike", "Rest day"] },
    schema: { type: "array", items: { type: "string" }, description: "Activities with duration if mentioned" },
  },
  {
    id: "weight",
    label: "Weight",
    icon: Scale,
    tone: "sky",
    description: "Optional weigh-ins",
    promptHint: "their weight, only if they want to share it",
    quick: { kind: "number", unit: "lbs" },
    schema: { type: "number", description: "Weight in lbs" },
  },
  {
    id: "water",
    label: "Water",
    icon: Droplets,
    tone: "sky",
    description: "Cups of fluid",
    promptHint: "how much water or fluid they drank",
    quick: { kind: "number", unit: "cups" },
    schema: { type: "number", description: "Cups of water/fluid" },
  },
  {
    id: "sleep",
    label: "Sleep",
    icon: Moon,
    tone: "lavender",
    description: "Hours of sleep",
    promptHint: "how they slept",
    quick: { kind: "number", unit: "hours" },
    schema: { type: "number", description: "Hours slept" },
  },
  {
    id: "wins",
    label: "Wins & struggles",
    icon: Sparkles,
    tone: "honey",
    description: "What went well, what was hard",
    promptHint: "one thing that went well and anything that felt hard",
    quick: { kind: "text", placeholder: "One thing that went well…" },
    schema: {
      type: "object",
      properties: {
        wins: { type: "array", items: { type: "string" } },
        struggles: { type: "array", items: { type: "string" } },
      },
    },
  },
];

export const itemById = (id: string) => TRACKING_ITEMS.find((i) => i.id === id);

export const CADENCES = [
  { id: "daily", label: "Every day", days: 1 },
  { id: "3x", label: "About 3× a week", days: 2 },
  { id: "weekly", label: "Once a week", days: 7 },
  { id: "flexible", label: "Only when I want to", days: null },
] as const;

export const MODES = [
  { id: "voice", label: "Talk it out", icon: Mic, hint: "Chat with your companion" },
  { id: "text", label: "Write it", icon: PenLine, hint: "Journal in your own words" },
  { id: "quick", label: "Quick tap", icon: ListChecks, hint: "A few taps, done" },
] as const;
