import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";
import { getProfile } from "@/lib/store";

const SYSTEM = `You are a supportive health & nutrition question helper for patients in a dietitian-led lifestyle medicine program. Many patients take GLP-1/GIP medications and some are preparing for or recovering from joint replacement.

Strict rules:
1. Answer ONLY using the reference documents provided. Cite them. Do not use outside knowledge.
2. If the documents don't cover the question, say so plainly and suggest bringing it to their dietitian ({{dietitian}}). Don't guess.
3. NEVER recommend, adjust, or comment on medication doses, dose timing, missed doses, starting/stopping or switching medication, or specific numeric targets that a clinician should individualize. For those, say kindly that this is a decision for their prescriber or care team, and still share relevant general info from the references if there is any.
4. Never diagnose. If the patient describes symptoms that the references list as urgent, tell them to contact their care team now, or call 911 in an emergency. For thoughts of self-harm, give the 988 Suicide & Crisis Lifeline.
5. Use plain language: warm, non-judgmental, encouraging, no shame. Keep it short (under 150 words). Write plain text with no markdown (no asterisks or headings); for lists, start lines with "• ".`;

const GLP1_CONTEXT = {
  yes: "currently taking a GLP-1 medication",
  considering: "not on a GLP-1 medication but considering one; give balanced information from the references and encourage discussing it with their prescriber",
  no: "not taking a GLP-1 medication",
};

async function loadReferences() {
  const dir = path.join(process.cwd(), "references");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(
    files.map(async (f) => {
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      const title = raw.match(/^title:\s*(.+)$/m)?.[1] ?? f;
      const source = raw.match(/^source:\s*(.+)$/m)?.[1] ?? "";
      const body = raw.replace(/^---[\s\S]*?---\s*/, "");
      return { title, source, body };
    })
  );
}

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string };
  const [refs, profile] = await Promise.all([loadReferences(), getProfile()]);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system:
      SYSTEM.replace("{{dietitian}}", profile?.dietitianName || "your dietitian") +
      (profile?.glp1Status ? `\n\nAbout this patient: ${GLP1_CONTEXT[profile.glp1Status]}${profile.glp1Medication ? ` (${profile.glp1Medication})` : ""}.` : ""),
    messages: [
      {
        role: "user",
        content: [
          ...refs.map((r) => ({
            type: "document" as const,
            source: { type: "text" as const, media_type: "text/plain" as const, data: r.body },
            title: r.title,
            context: `Source: ${r.source}`,
            citations: { enabled: true },
          })),
          { type: "text" as const, text: question },
        ],
      },
    ],
  });

  const segments = response.content
    .filter((b) => b.type === "text")
    .map((b) => ({
      text: b.text,
      citations: (b.citations ?? []).map((c) => ({
        title: "document_title" in c ? c.document_title : null,
        quote: c.cited_text,
      })),
    }));

  return NextResponse.json({
    segments,
    sources: refs.map((r) => ({ title: r.title, source: r.source })),
  });
}
