# 🌱 Alongside

Patient companion for the time between dietitian visits (Claude Build Day, Track 1: Beyond the Clinic).

- **Onboarding**: the patient chooses what to track and how often (daily / 3×/week / weekly / whenever).
- **Check in three ways**: 🎙️ voice (ElevenLabs agent on Claude), ✍️ free-text journal, or 👆 quick tap. Voice and text are turned into a structured log by Claude (`/api/extract`); quick tap skips the LLM.
- **Ask**: answers come only from the curated docs in `references/`, using Claude's Citations API. The assistant never gives dose or medication advice.
- **Safety**: red-flag symptoms show a care-team / 911 / 988 banner.

## Run
```
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY (+ ElevenLabs agent ID for voice)
npm install && npm run dev
```
Voice setup: see `ELEVENLABS_AGENT.md`. Reset demo state: `rm data/profile.json data/checkins.json`.

Key files: `lib/tracking.ts` (registry driving onboarding, quick log, agent topics, and the extraction schema), `app/api/extract`, `app/api/ask`, `references/*.md` (DRAFT, pending clinician review).
