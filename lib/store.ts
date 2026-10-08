import { promises as fs } from "fs";
import path from "path";
import type { GoalAssessment } from "./goals";
import type { CheckIn, Profile } from "./types";

const DATA = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA, file), "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(DATA, { recursive: true });
  await fs.writeFile(path.join(DATA, file), JSON.stringify(value, null, 2));
}

export const getProfile = () => readJson<Profile | null>("profile.json", null);
export const saveProfile = (p: Profile) => writeJson("profile.json", p);

export async function getCheckIns(): Promise<CheckIn[]> {
  const existing = await readJson<CheckIn[] | null>("checkins.json", null);
  if (existing) return existing;
  const seed = await readJson<CheckIn[]>("checkins.seed.json", []);
  await writeJson("checkins.json", seed);
  return seed;
}

export async function addCheckIn(c: CheckIn) {
  const all = await getCheckIns();
  all.push(c);
  await writeJson("checkins.json", all);
  return c;
}

// Goal assessments are cached per check-in + goal so each check-in is only judged once.
export const getGoalAssessments = () => readJson<GoalAssessment[]>("goal-assessments.json", []);
export const saveGoalAssessments = (a: GoalAssessment[]) => writeJson("goal-assessments.json", a);
