export type Cadence = "daily" | "3x" | "weekly" | "flexible";
export type Mode = "voice" | "text" | "quick";

export type Glp1Status = "yes" | "considering" | "no";

export type Profile = {
  name: string;
  glp1Status?: Glp1Status;
  glp1Medication?: string;
  trackingItems: string[];
  cadence: Cadence;
  preferredMode: Mode;
  dietitianName: string;
  dietitianGoals: string;
};

export type CheckIn = {
  id: string;
  date: string; // ISO timestamp
  mode: Mode;
  entries: Record<string, unknown>;
  redFlags: string[];
  summary?: string;
  followUp?: string;
};
