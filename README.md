# Team 4 · Beyond the Clinic

Claude Build Day | Mental Health & Wellness — Thu, Oct 8 2026, Fabrik NYC

## Track

**Track 1 · Beyond the Clinic: Continuous Patient Support & Engagement**

Build AI tools that support patients between visits (check-ins, coaching, symptom tracking, ongoing engagement) so care doesn't stop when the appointment ends.

## Team

| Name | Role | Background |
| --- | --- | --- |
| Kate Cohen | Practitioner | Clinical Nutritionist / Dietitian, Hospital for Special Surgery (Lifestyle Medicine) |
| Leah Ahn | Practitioner | Founder, Therapy Connect |
| Christy Lee | Engineer | CEO/Co-founder, PatientCompanion |
| Nikhil A. | Engineer | Grad student, Columbia Dept. of Biomedical Informatics |

## Problem space

From team intros:

- **Gaps between visits** (Kate): patients with obesity preparing for / recovering from knee or hip replacement are seen at most every ~3 weeks, sometimes only a few times post-op due to inconsistent dietitian coverage. Many are on GLP-1/GIP meds, have decades of struggle and often trauma history, and need structure + accountability for long-term behavior change.
- **Low-effort symptom tracking** (Christy): tracking should fit into patients' days, not add a task. Prior work on Parkinson's and Myasthenia Gravis tracking, plus in-hospital patient communication.
- **Voice as a low-friction modality** (Nikhil): voice-based tracking, reflection and sensemaking for chronic/idiopathic conditions (e.g. endometriosis prototype: <https://demo.nikhil.io/endochron/#/record>); also exploring agents for people on GLP-1s.

### Candidate idea

A between-visit companion for patients on GLP-1/GIP meds (and peri-surgical patients):

- Safe space to ask health & nutrition questions, with evidence-based answers
- Voice check-ins for low-effort logging and reflection
- Feedback + accountability loop
- Summary for the clinician before the next visit

## Tech stack

- [Claude API](https://platform.claude.com) (team Console org)
- [ElevenLabs](https://elevenlabs.io) for voice (Creator plan via sponsor coupon; see the ElevenLabs Hacker Guide)
- Next.js (App Router) + TypeScript + Tailwind, `@anthropic-ai/sdk`, `@elevenlabs/react`, Lucide icons
- Local JSON files for storage (prototype only)

## What we built: Alongside 🌱

A warm, mobile-first companion for the time between dietitian visits.

- **Onboarding:** name, GLP-1 status (taking / considering / no), goals (tap common ones or write your own), what to track, how often to check in, and a preferred check-in style.
- **Check in three ways:** 🎙️ voice (ElevenLabs agent with Claude as the LLM), ✍️ free-text journal, or 👆 quick tap. Claude turns voice and text into a structured log (structured outputs) that records only what the patient said, and flags red-flag symptoms with a care-team / 911 / 988 banner.
- **Goals:** per-goal progress over the last 2 weeks. Claude assesses each check-in against each goal and quotes the patient's own words as evidence. Includes a one-tap "I did this today".
- **History:** weight trend, mood, water, sleep, check-in calendar, and GLP-1 side-effect frequency, plus every past check-in.
- **Ask:** answers grounded **only** in curated references (`references/*.md`) using Claude's Citations API. It never gives dose or medication-change advice.

Key files: `lib/tracking.ts` (one registry that drives onboarding, quick log, voice topics, and the extraction schema), `app/api/extract`, `app/api/goals`, `app/api/ask`, and `references/*.md` (**DRAFT, pending clinician review**).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID
npm run dev
```

Voice setup: see [`ELEVENLABS_AGENT.md`](ELEVENLABS_AGENT.md) for the agent's prompt and first message.

Reset demo state (re-seeds 6 sample check-ins on next load):

```bash
rm -f data/profile.json data/checkins.json data/goal-assessments.json
```

## Demo

2 hours to build, 2–3 minute demo.

## Disclaimer

Hackathon prototype. Synthetic data only. Not medical advice.
