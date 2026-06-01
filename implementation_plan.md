# PitLane IQ — Implementation Plan

F1 Race Intelligence Platform · IBM AI Builders Challenge

## Background

PitLane IQ is a deployable race intelligence platform that loads any F1 session (2018–present) via FastF1, computes real strategy intelligence (tyre degradation, undercut windows, pit timing), provides race replay with AI annotations, conversational AI Q&A, shadow intelligence feed, and what-if pit stop simulation.

**Tech Stack:**
- **Backend:** Python 3.10+, FastAPI, FastF1 (v3.8.x), SQLite, scikit-learn, scipy
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Recharts + D3.js + Zustand
- **AI/LLM:** Groq API (llama-3.3-70b-versatile) primary, OpenRouter (IBM Granite 4.1 8B) fallback
- **IBM Tools:** Langflow (self-hosted, conversational AI pipeline), Docling (PDF ingestion)

---

## User Review Required

> [!IMPORTANT]
> **API Keys**: You will need a free Groq API key from [console.groq.com](https://console.groq.com). Optionally an OpenRouter key for Granite fallback. Please have these ready before Phase 6 testing.

> [!IMPORTANT]
> **Langflow**: Langflow must be installed and running on port 7860 for the conversational AI feature. We'll build the flow JSON programmatically and provide instructions for importing it.

> [!WARNING]
> **First session load**: FastF1 downloads ~30-60s of data per session from the F1 API on first load. Subsequent loads are instant from SQLite cache. Internet connection required for first load of any session.

> [!IMPORTANT]
> **Tailwind CSS**: The spec requests Tailwind. The system guidelines prefer vanilla CSS unless explicitly requested. Since the spec explicitly names Tailwind, I will use **Tailwind CSS v3** as specified. Please confirm this is acceptable.

## Open Questions

> [!IMPORTANT]
> 1. **Tailwind version**: The spec says Tailwind. Should I use **Tailwind v3** (stable, PostCSS) or **Tailwind v4** (newer, CSS-first)? I'll default to v3 for stability.
> 2. **Python version**: The spec doesn't specify. Docling requires Python 3.10+. Should I target 3.10, 3.11, or 3.12? I'll default to 3.10+ compatibility.
> 3. **Langflow self-hosting**: Do you want Langflow running as a separate process (recommended for MVP), or embedded? I'll set it up as a separate process with clear startup instructions.

---

## Proposed Changes

The build is organized into **8 phases**, each producing a testable milestone. I'll implement them sequentially.

---

### Phase 1: Project Scaffolding & Configuration

Set up the complete directory structure, dependency files, environment configuration, and both backend/frontend project skeletons.

#### [NEW] [requirements.txt](file:///c:/Users/seths/Downloads/ibm_coded_v2/requirements.txt)
All Python dependencies:
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
websockets>=12.0
fastf1>=3.4.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
scipy>=1.11.0
docling>=2.0.0
openai>=1.30.0
python-dotenv>=1.0.0
aiosqlite>=0.19.0
pydantic>=2.5.0
rich>=13.0.0
httpx>=0.27.0
```

#### [NEW] [.env.example](file:///c:/Users/seths/Downloads/ibm_coded_v2/.env.example)
Environment template with all config vars.

#### [NEW] [README.md](file:///c:/Users/seths/Downloads/ibm_coded_v2/README.md)
Project readme with setup instructions.

#### [NEW] Complete directory structure
```
pitlane-iq/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── database.py
│   ├── telemetry/
│   ├── strategy/
│   ├── replay/
│   ├── intelligence/
│   ├── ingestion/
│   └── llm/
├── dashboard/          (Vite React app)
├── agents/
├── data/
│   ├── cache/
│   └── docs/
├── .env.example
├── requirements.txt
└── README.md
```

---

### Phase 2: Data Layer — FastF1 + SQLite

Build the session loading pipeline, SQLite schema, and data processing layer.

#### [NEW] [backend/config.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/config.py)
- Centralized configuration from environment variables
- LLM provider selection (groq/openrouter)
- Database URL, cache paths, API keys

#### [NEW] [backend/database.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/database.py)
- SQLite connection management (aiosqlite for async)
- Schema creation (sessions, laps, strategy_cache, shadow_events tables)
- Migration helpers

#### [NEW] [backend/models.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/models.py)
- Pydantic models: `SessionInfo`, `LapData`, `StintData`, `TelemetryPoint`
- Request/response schemas: `LoadSessionRequest`, `SessionResponse`, `ChatRequest`, `ChatResponse`
- Strategy models: `TyreDegResult`, `UnderCutThreat`, `PitWindow`, `WhatIfResult`
- Replay models: `RaceFrame`, `RaceEvent`
- Intelligence models: `ShadowInsight`, `InsightCard`

#### [NEW] [backend/telemetry/loader.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/telemetry/loader.py)
- `SessionLoader` class: loads sessions via `fastf1.get_session(year, round, type)`
- Enables FastF1 cache at `./data/cache`
- Stores processed lap data into SQLite
- Returns session metadata

#### [NEW] [backend/telemetry/processor.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/telemetry/processor.py)
- `LapProcessor` class: cleans raw FastF1 lap data
- Stint detection using `Stint` column + `PitInTime`/`PitOutTime`
- Lap time conversion (timedelta → seconds float)
- Filters invalid laps (`IsAccurate` check)
- Computes derived fields: gap_to_leader, gap_to_ahead

#### [NEW] [backend/telemetry/schemas.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/telemetry/schemas.py)
- Data transfer objects for telemetry pipeline

---

### Phase 3: Strategy Engine — The Core Intelligence

This is the differentiating engineering work. Four modules that compute real race strategy.

#### [NEW] [backend/strategy/deg_model.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/strategy/deg_model.py)
`TyreDegModel` class:
- `fit(stint_laps: pd.DataFrame) → dict`: Removes fuel effect (-0.03s/lap), fits linear regression on residuals vs `TyreLife`, returns `{deg_rate_per_lap, r2_score, base_pace, predicted_cliff_lap, compound}`
- `predict_window(tyre_life, deg_rate, gap_to_rival, pit_loss=22.0) → dict`: Returns `{optimal_lap_range, urgency, projected_gain_seconds}`
- Cliff detection: when predicted lap time exceeds base_pace + 1.5s
- Compound baseline adjustments: SOFT +0.08, MEDIUM +0.05, HARD +0.03 (circuit-adjusted)

#### [NEW] [backend/strategy/undercut.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/strategy/undercut.py)
`UnderCutAnalyser` class:
- `compute_threat(driver_laps, rival_laps, current_lap) → UnderCutThreat`
- Inputs: gap_delta_trend (last 5 laps), tyre_age_delta, deg_rate_delta
- Formula: `score = gap_delta_trend × 0.4 + tyre_age_delta × 0.35 + deg_rate_delta × 0.25`
- Returns: score 0–100, urgency (none/watch/act/critical), projected_position_loss, trigger_lap_estimate

#### [NEW] [backend/strategy/pit_window.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/strategy/pit_window.py)
`PitWindowCalculator` class:
- Combines deg model predictions with undercut analysis
- Computes optimal pit lap considering: tyre cliff, undercut threat, traffic, safety car probability
- Returns confidence-scored window ranges

#### [NEW] [backend/strategy/what_if.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/strategy/what_if.py)
`WhatIfEngine` class:
- `simulate_alternate_pit(session_key, driver, actual_pit_lap, hypothetical_pit_lap) → WhatIfResult`
- Steps: (1) get deg models for both scenarios, (2) compute lap time delta per lap, (3) compute track position accounting for ~22s pit loss, (4) cumulative time comparison
- Returns: position_delta, time_delta, confidence, verdict string

---

### Phase 4: Race Replay Engine

Data-driven frame-by-frame race reconstruction with event detection.

#### [NEW] [backend/replay/event_detector.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/replay/event_detector.py)
- Detects: overtakes (position changes between laps), pit stops (PitInTime not null), safety cars (TrackStatus), fastest laps, incidents
- Each event: `{type, lap, driver, description, significance_score}`

#### [NEW] [backend/replay/frame_builder.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/replay/frame_builder.py)
`RaceReplay` class:
- `build_frames(session_key) → Dict[int, RaceFrame]`: One frame per lap
- Each RaceFrame: `{lap, positions: {driver→pos}, gaps: {driver→gap}, events: [...], tyre_compounds: {driver→compound}, tyre_life: {driver→age}, safety_car: bool}`
- Pre-built dict for O(1) lookup by lap number

---

### Phase 5: Intelligence Layer — Shadow Feed + LLM + Docling

#### [NEW] [backend/intelligence/shadow_feed.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/intelligence/shadow_feed.py)
`ShadowFeed` class:
- `generate_insights(session_key, current_lap, strategy_data) → List[ShadowInsight]`
- Uses undercut analyser, deg model, and gap trends
- Each insight: `{message, confidence (0-1), category, driver, lap}`
- `get_alerts()`: confidence > 0.85
- `get_queued()`: confidence ≤ 0.85

#### [NEW] [backend/intelligence/insight_generator.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/intelligence/insight_generator.py)
- Generates human-readable insight text from raw strategy data
- Templates for undercut warnings, cliff predictions, gap closures, weather risks

#### [NEW] [backend/llm/client.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/llm/client.py)
- Unified LLM client using OpenAI SDK
- Groq: `base_url="https://api.groq.com/openai/v1"`, model `llama-3.3-70b-versatile`
- OpenRouter: `base_url="https://openrouter.ai/api/v1"`, model `ibm-granite/granite-4.1-8b`
- Provider selection via `LLM_PROVIDER` env var
- Streaming support, temperature 0.2, max_tokens 600

#### [NEW] [backend/intelligence/langflow_client.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/intelligence/langflow_client.py)
- HTTP client to Langflow REST API (`POST /api/v1/run/{flow_id}`)
- Sends session context + user question
- Falls back to direct LLM call if Langflow is unavailable
- Handles response parsing and citation extraction

#### [NEW] [backend/ingestion/docling_ingest.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/ingestion/docling_ingest.py)
`RaceDocIngestor` class:
- `ingest(pdf_path) → str`: Converts PDF to markdown via Docling
- `ingest_all() → List[dict]`: Processes all PDFs in `data/docs/`
- Returns chunked text for Langflow context injection

#### [NEW] [agents/race_qa_flow.json](file:///c:/Users/seths/Downloads/ibm_coded_v2/agents/race_qa_flow.json)
# IBM Granite Strategy Integration

This plan outlines the integration of IBM Granite (via OpenRouter) to act as an Explainable AI Race Engineer. The goal is to feed our mathematically deterministic, real FastF1 telemetry into Granite to generate strategic debriefs and pit recommendations, definitively beating competitors who rely on mock data.

## Proposed Changes

### Backend LLM Service

#### [NEW] `backend/llm/granite.py`
- Build an LLM client that authenticates with OpenRouter using the `OPENROUTER_API_KEY`.
- Target the `ibm-granite/granite-4.1-8b` model (or similar fallback).
- Create a `generate_strategy_debrief(session_data, strategy_data, target_driver)` function.
- The system prompt will inject the driver's current position, tire degradation percentage, gap to leader, and any undercut threats.

### Backend Intelligence Layer

#### [NEW] `backend/intelligence/debrief.py`
- An orchestration layer that:
  1. Fetches real telemetry/strategy from `database.py` and `StrategyService`.
  2. Formats the data into a clean, text-based JSON/markdown schema for the LLM to understand.
  3. Invokes the Granite LLM service.

### API Routing

#### [MODIFY] `backend/main.py`
- Add a new endpoint: `GET /api/sessions/{session_key}/debrief/{driver}`
- This endpoint will call `backend.intelligence.debrief` and return a structured JSON response containing the AI's explanation, confidence score, and recommended action.

## Verification Plan
1. Send a request to `/api/sessions/2024_1_R/debrief/VER`.
2. Verify that the response contains an explainable strategy decision generated by IBM Granite.
3. Verify that the numbers cited by Granite accurately reflect the underlying SQLite database (e.g., matching the true tire wear %).

---

### Phase 6: Backend API — FastAPI Routes + WebSocket

#### [NEW] [backend/main.py](file:///c:/Users/seths/Downloads/ibm_coded_v2/backend/main.py)
Complete FastAPI application with all routes:

```
GET  /api/sessions                              → list cached sessions
POST /api/sessions/load                         → load new session {year, round, type}
GET  /api/sessions/{key}                        → session metadata
GET  /api/sessions/{key}/laps                   → all laps data
GET  /api/sessions/{key}/laps/{driver}          → driver-specific laps
GET  /api/sessions/{key}/telemetry/{driver}/{lap} → full telemetry
GET  /api/sessions/{key}/strategy               → computed strategy (all drivers)
GET  /api/sessions/{key}/strategy/{driver}      → single driver strategy
GET  /api/sessions/{key}/replay                 → pre-built replay frames
GET  /api/sessions/{key}/shadow                 → shadow feed for session
POST /api/sessions/{key}/whatif                 → what-if simulation
POST /api/chat                                  → conversational AI
WS   /ws/sessions/{key}/shadow                  → live shadow feed during replay
GET  /api/health                                → health check
```

- CORS middleware for frontend dev server
- Startup event: initialize database, FastF1 cache
- Background task support for session loading (long operation)
- Error handling with structured error responses

---

### Phase 7: Frontend Dashboard

Built with Vite + React + TypeScript + Tailwind CSS + Recharts + D3.

#### Initialization
```bash
npm create vite@latest dashboard -- --template react-ts
cd dashboard
npm install recharts d3 axios zustand @types/d3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

#### Design System
Following spec: Linear + TradingView + F1 Timing aesthetic
- Colors: `--bg-base: #0A0A0B`, `--bg-surface: #111113`, `--bg-elevated: #18181B`
- Fonts: JetBrains Mono (numbers), Inter (UI)
- Team colors, tyre compound colors
- Restrained motion: 150ms ease transitions only

#### Component Structure

**Layout:**

#### [NEW] [dashboard/src/components/layout/AppShell.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/layout/AppShell.tsx)
- Top nav with PitLane IQ branding
- Sidebar navigation (Strategy / Replay / Intelligence / Chat)
- Main content area with responsive grid

#### [NEW] [dashboard/src/components/layout/SessionSelector.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/layout/SessionSelector.tsx)
- Year picker (2018–present)
- Round/GP selector (populated from FastF1)
- Session type (FP1/FP2/FP3/Q/R)
- Loading state with progress indicator

#### [NEW] [dashboard/src/components/layout/CommandBar.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/layout/CommandBar.tsx)
- Global search + keyboard shortcuts (Cmd+K)

**Telemetry Charts:**

#### [NEW] [dashboard/src/components/telemetry/SpeedTrace.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/telemetry/SpeedTrace.tsx)
- Speed/throttle/brake overlay using Recharts `ComposedChart`
- Multi-driver comparison mode

#### [NEW] [dashboard/src/components/telemetry/LapDeltaChart.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/telemetry/LapDeltaChart.tsx)
- Rolling average lap time delta per driver
- Baseline comparison (fastest lap / leader / selected driver)

#### [NEW] [dashboard/src/components/telemetry/TyreDegChart.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/telemetry/TyreDegChart.tsx)
- Degradation rate per stint per compound
- Regression line overlay showing predicted cliff

#### [NEW] [dashboard/src/components/telemetry/SectorHeatmap.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/telemetry/SectorHeatmap.tsx)
- Sector time comparison grid (drivers × laps)
- Color-coded: green (personal best), purple (overall best), yellow (standard)

**Strategy Components:**

#### [NEW] [dashboard/src/components/strategy/RaceTimeline.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/strategy/RaceTimeline.tsx)
THE core component. Horizontal timeline with:
- Stint bars colored by compound (soft=red, medium=yellow, hard=white, inter=green, wet=blue)
- Pit stop vertical markers
- Event triangles (SC=yellow, overtake=green, incident=red)
- AI insight diamonds (clickable)
- Lap numbers on X-axis every 5 laps
- Interactive: click events for detail, hover stints for deg rate

#### [NEW] [dashboard/src/components/strategy/StintCards.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/strategy/StintCards.tsx)
- Each stint: compound badge, age, deg rate, avg pace

#### [NEW] [dashboard/src/components/strategy/UnderCutGauge.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/strategy/UnderCutGauge.tsx)
- Threat score 0–100 per rival pair
- Color gradient none→watch→act→critical

#### [NEW] [dashboard/src/components/strategy/PitWindowBand.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/strategy/PitWindowBand.tsx)
- Optimal pit window overlay on RaceTimeline

#### [NEW] [dashboard/src/components/strategy/PositionTracker.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/strategy/PositionTracker.tsx)
- Position changes over race distance (Recharts line chart)
- Gap deltas, crossover points highlighted

**Replay Components:**

#### [NEW] [dashboard/src/components/replay/ReplayController.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/replay/ReplayController.tsx)
- Play/pause/scrub/speed controls (1x, 2x, 5x, 10x)
- Current lap indicator
- Frame-by-frame navigation

#### [NEW] [dashboard/src/components/replay/TrackMap.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/replay/TrackMap.tsx)
- D3 SVG circuit layout with car position dots
- Colored by team, numbered by driver
- Animated position updates during replay

#### [NEW] [dashboard/src/components/replay/EventMarker.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/replay/EventMarker.tsx)
- Pit, overtake, SC annotations on timeline

**Intelligence Components:**

#### [NEW] [dashboard/src/components/intelligence/ShadowPanel.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/intelligence/ShadowPanel.tsx)
- Buffered insights list with confidence scores
- Split: alerts (>0.85) at top, queued below
- Auto-scroll, category filtering

#### [NEW] [dashboard/src/components/intelligence/InsightCard.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/intelligence/InsightCard.tsx)
- Individual insight display with confidence badge
- Category icon, driver chip, lap reference

#### [NEW] [dashboard/src/components/intelligence/WhatIfPanel.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/intelligence/WhatIfPanel.tsx)
- Driver selector, actual pit lap display
- Hypothetical pit lap slider
- Results: position delta, time delta, verdict
- Visual comparison chart

#### [NEW] [dashboard/src/components/intelligence/DebriefChat.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/intelligence/DebriefChat.tsx)
- Chat interface with message history
- Session context auto-attached
- Streaming responses from LLM
- Lap-specific citations highlighted in responses

**Shared Components:**

#### [NEW] [dashboard/src/components/shared/DriverChip.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/shared/DriverChip.tsx)
- Driver number + team color badge

#### [NEW] [dashboard/src/components/shared/CompoundBadge.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/shared/CompoundBadge.tsx)
- S/M/H/I/W tyre compound badge

#### [NEW] [dashboard/src/components/shared/ConfidenceBadge.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/shared/ConfidenceBadge.tsx)
- 0–100 confidence score display

#### [NEW] [dashboard/src/components/shared/LapBadge.tsx](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/components/shared/LapBadge.tsx)
- Lap number display component

**Hooks & State:**

#### [NEW] [dashboard/src/hooks/useSession.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/hooks/useSession.ts)
- Session data fetching, loading state, error handling

#### [NEW] [dashboard/src/hooks/useReplay.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/hooks/useReplay.ts)
- Replay state machine: idle → loading → playing → paused
- Frame advancement timer, speed control

#### [NEW] [dashboard/src/hooks/useShadow.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/hooks/useShadow.ts)
- WebSocket connection to shadow feed
- Insight buffering and filtering

#### [NEW] [dashboard/src/stores/sessionStore.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/stores/sessionStore.ts)
- Zustand global state: current session, selected drivers, active tab, replay state

#### [NEW] [dashboard/src/lib/api.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/lib/api.ts)
- Typed Axios API client for all backend endpoints

#### [NEW] [dashboard/src/lib/formatters.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/lib/formatters.ts)
- Lap time formatting (1:23.456)
- Gap display (+1.234s)
- Driver name abbreviations
- Team color mapping

#### [NEW] [dashboard/src/lib/constants.ts](file:///c:/Users/seths/Downloads/ibm_coded_v2/dashboard/src/lib/constants.ts)
- Team colors, compound colors, tyre compound mappings
- API base URL configuration

---

### Phase 8: Integration, Testing & Polish

#### Backend Testing
- Test session loading with a known race (e.g., 2023 Bahrain GP)
- Verify deg model produces reasonable rates (SOFT ~0.08s/lap range)
- Verify undercut detection against known undercuts
- Test replay frame count matches race laps
- Test shadow feed produces insights with valid confidence scores
- Test chat endpoint returns contextual answers
- Test what-if engine produces reasonable position deltas

#### Frontend Testing
- Visual verification of all charts rendering
- RaceTimeline interaction (click events, hover stints)
- Replay controller functionality
- Chat interface with streaming responses
- Shadow panel WebSocket connection

#### End-to-End
- Load session → view strategy → replay race → ask questions → run what-if
- Verify no hardcoded data anywhere

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd pitlane-iq
python -m pytest backend/tests/ -v

# Frontend
cd dashboard
npm run build  # verify no TypeScript errors
```

### Manual Verification
1. Start backend: `uvicorn backend.main:app --reload --port 8000`
2. Start frontend: `cd dashboard && npm run dev`
3. Load session: Select 2023 Bahrain GP Race
4. Verify: lap data loads, strategy computes, replay plays, chat responds
5. Check: no hardcoded data, all computed from FastF1 session data

### Specific Validations
- **Deg model**: Verify SOFT compounds show higher deg rate than HARD
- **Undercut**: Verify known undercut attempts (e.g., VER vs LEC) detected
- **Replay**: Verify frame count ≈ total race laps
- **Shadow feed**: Verify insights generated with confidence scores
- **Chat**: Ask "Why did the leader pit on lap X?" and verify contextual answer
- **What-if**: Simulate pitting 3 laps earlier, verify reasonable output

---

## Build Order (Sequential)

| Phase | What | Estimated Files | Dependencies |
|-------|------|----------------|--------------|
| 1 | Scaffolding & Config | ~8 | None |
| 2 | Data Layer (FastF1 + SQLite) | ~8 | Phase 1 |
| 3 | Strategy Engine | ~5 | Phase 2 |
| 4 | Replay Engine | ~3 | Phase 2 |
| 5 | Intelligence Layer | ~6 | Phase 3, 4 |
| 6 | Backend API (FastAPI) | ~2 | Phase 2-5 |
| 7 | Frontend Dashboard | ~25+ | Phase 6 |
| 8 | Testing & Polish | ~5 | All |
| 9 | Supabase Migration | ~4 | Phase 2, 6 |

---

## Phase 9: Supabase Migration (Proposed)

We are proposing a shift from our local SQLite database to **Supabase** (PostgreSQL).

### Why migrate to Supabase?
1. **Concurrency & Scale**: SQLite locks the database during writes. When multiple users hit FastF1 concurrently, SQLite can bottleneck. PostgreSQL handles heavy concurrent read/writes effortlessly.
2. **Real-time Telemetry via WebSockets**: Supabase provides out-of-the-box Realtime subscriptions via WebSockets. We can rip out our custom Python WebSockets for the Shadow Feed and simply broadcast telemetry to a Supabase Realtime channel, drastically simplifying the backend.
3. **Cloud-Ready Deployment**: Right now, our SQLite cache is a local file (`pitlane_iq.db`). If we deploy the backend to a serverless platform (like Vercel, Railway, or Render), the local file system is ephemeral. Supabase gives us persistent, decoupled cloud storage.
4. **Vector Storage (pgvector)**: For our conversational AI, Supabase natively supports pgvector. We can store past race strategies and insights as embeddings, allowing the LLM to search historical races instantly using RAG (Retrieval-Augmented Generation).
5. **Future-proofing (Auth)**: If we want to add user accounts (e.g., "Save my custom pit-window simulations"), Supabase Auth + Row Level Security (RLS) handles it securely in minutes.

### Migration Steps:
1. Swap `aiosqlite` for the `supabase` Python SDK in `backend/database.py`.
2. Recreate the schema (sessions, laps, strategy_cache) as PostgreSQL tables via the Supabase Dashboard SQL Editor.
3. Update the `SessionLoader` and endpoints to read/write using the Supabase client instead of raw SQL strings.

**Total: ~60+ files, 9 phases**

I will build this step-by-step, testing each phase before moving to the next. No shortcuts, no fake data, no demo flows.
