export const COMMON_GOALS = [
  "Protein at every meal",
  "Eat slowly and stop at first fullness",
  "Drink 6+ cups of water a day",
  "Walk 10 minutes most days",
  "Do my PT exercises",
  "Add a vegetable to lunch and dinner",
  "Plan meals for the week",
  "Notice emotional eating without judgment",
  "Swap sugary drinks for water",
  "Sleep 7+ hours",
];

// Goals are stored as one "; "-separated string so the voice agent and home screen can use them as-is.
export const splitGoals = (g: string) => g.split(";").map((x) => x.trim()).filter(Boolean);

export type GoalStatus = "met" | "partial" | "not_mentioned";

export type GoalAssessment = { checkInId: string; goal: string; status: GoalStatus; evidence: string };

export type GoalProgress = {
  goal: string;
  timeline: { checkInId: string; date: string; status: GoalStatus; evidence: string }[];
  metCount: number;
  latestEvidence?: string;
};
