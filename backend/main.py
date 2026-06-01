"""
PitLane IQ — FastAPI Application
Main entry point. Routes are added incrementally as features are built.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend import database
from backend.models import (
    LoadSessionRequest, SessionInfo, SessionListItem, LapData,
    SessionStrategy, WhatIfRequest, WhatIfResult
)
from backend.api.strategy_service import StrategyService
from backend.strategy import WhatIfEngine
from backend.replay import RaceReplay
from backend.telemetry.loader import (
    load_session, make_session_key, get_event_schedule, load_telemetry,
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


# ── App lifecycle ────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("PitLane IQ starting up...")
    database.init_db()
    logger.info("Database initialized")
    yield
    logger.info("PitLane IQ shutting down...")


app = FastAPI(
    title="PitLane IQ",
    description="F1 Race Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3333"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Track loading state ─────────────────────────────

# Simple in-memory dict to track which sessions are currently loading
_loading_sessions: dict[str, str] = {}  # key -> status


# ── Health ───────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "pitlane-iq"}


# ── Schedule ─────────────────────────────────────────

@app.get("/api/schedule/{year}")
def get_schedule(year: int):
    """Get F1 event schedule for a year."""
    if year < 2018 or year > 2026:
        raise HTTPException(400, "Year must be between 2018 and 2026")
    events = get_event_schedule(year)
    if not events:
        raise HTTPException(404, f"No schedule found for {year}")
    return {"year": year, "events": events}


# ── Sessions ─────────────────────────────────────────

@app.get("/api/sessions", response_model=list[SessionListItem])
def list_sessions():
    """List all cached sessions."""
    return database.list_sessions()


@app.post("/api/sessions/load")
def load_session_endpoint(req: LoadSessionRequest, background_tasks: BackgroundTasks):
    """Load a new session from FastF1.

    If the session is already cached, returns immediately.
    Otherwise starts a background load and returns status.
    """
    session_key = make_session_key(req.year, req.round, req.session_type)

    # Already cached?
    existing = database.get_session(session_key)
    if existing:
        return {
            "status": "ready",
            "session": existing,
        }

    # Currently loading?
    if session_key in _loading_sessions:
        return {
            "status": "loading",
            "session_key": session_key,
            "message": "Session is being loaded...",
        }

    # Start loading in background
    _loading_sessions[session_key] = "loading"

    def _do_load():
        try:
            load_session(req.year, req.round, req.session_type)
            _loading_sessions[session_key] = "ready"
        except Exception as e:
            logger.error(f"Background load failed for {session_key}: {e}")
            _loading_sessions[session_key] = f"error: {str(e)}"

    background_tasks.add_task(_do_load)

    return {
        "status": "loading",
        "session_key": session_key,
        "message": "Session load started. Poll /api/sessions/load/status/{key} for updates.",
    }


@app.get("/api/sessions/load/status/{session_key}")
def load_status(session_key: str):
    """Check the loading status of a session."""
    # Check database first
    existing = database.get_session(session_key)
    if existing:
        # Clean up loading state
        _loading_sessions.pop(session_key, None)
        return {"status": "ready", "session": existing}

    status = _loading_sessions.get(session_key)
    if status is None:
        raise HTTPException(404, "Backend restarted or session load failed unexpectedly. Please click Load Session again.")

    if status.startswith("error"):
        error_msg = status.replace("error: ", "")
        _loading_sessions.pop(session_key, None)
        return {"status": "error", "message": error_msg}

    return {"status": "loading", "message": "Session is being loaded..."}


@app.get("/api/sessions/{session_key}")
def get_session_detail(session_key: str):
    """Get session metadata."""
    session = database.get_session(session_key)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


# ── Laps ─────────────────────────────────────────────

@app.get("/api/sessions/{session_key}/laps")
def get_laps(session_key: str, driver: str = None):
    """Get lap data for a session, optionally filtered by driver."""
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")
    laps = database.get_laps(session_key, driver)
    return {"session_key": session_key, "count": len(laps), "laps": laps}


@app.get("/api/sessions/{session_key}/laps/{driver}")
def get_driver_laps(session_key: str, driver: str):
    """Get lap data for a specific driver."""
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")
    laps = database.get_laps(session_key, driver.upper())
    if not laps:
        raise HTTPException(404, f"No laps found for driver {driver}")
    return {"session_key": session_key, "driver": driver.upper(), "laps": laps}


# ── Telemetry ────────────────────────────────────────

@app.get("/api/sessions/{session_key}/telemetry/{driver}/{lap}")
def get_telemetry(session_key: str, driver: str, lap: int):
    """Get detailed telemetry for a specific driver/lap.

    Note: This loads from FastF1 on-demand (not cached in SQLite).
    """
    session = database.get_session(session_key)
    if not session:
        raise HTTPException(404, "Session not found")

    parts = session_key.split("_")
    if len(parts) != 3:
        raise HTTPException(400, "Invalid session key format")

    year, round_num, session_type = int(parts[0]), int(parts[1]), parts[2]
    data = load_telemetry(year, round_num, session_type, driver.upper(), lap)
    if not data:
        raise HTTPException(404, "Telemetry not available for this driver/lap")

    return {
        "session_key": session_key,
        "driver": driver.upper(),
        "lap": lap,
        "points": data,
    }


# ── Strategy ─────────────────────────────────────────

strategy_service = StrategyService()
what_if_engine = WhatIfEngine()

@app.get("/api/sessions/{session_key}/strategy", response_model=SessionStrategy)
def get_session_strategy(session_key: str):
    """Get computed strategy for all drivers in a session."""
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")
        
    strategy = strategy_service.compute_session_strategy(session_key)
    if not strategy:
        raise HTTPException(500, "Failed to compute strategy")
        
    return strategy


@app.get("/api/sessions/{session_key}/strategy/{driver}")
def get_driver_strategy(session_key: str, driver: str):
    """Get computed strategy for a single driver."""
    strategy = get_session_strategy(session_key)
    driver_str = driver.upper()
    if driver_str not in strategy.drivers:
        raise HTTPException(404, f"No strategy found for driver {driver_str}")
    return strategy.drivers[driver_str]


@app.post("/api/sessions/{session_key}/whatif", response_model=WhatIfResult)
def simulate_what_if(session_key: str, req: WhatIfRequest):
    """Run a what-if simulation for a pit stop."""
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")
        
    # Get driver laps
    all_laps = database.get_laps(session_key, req.driver.upper())
    if not all_laps:
         raise HTTPException(404, f"No laps found for driver {req.driver}")
         
    # To run what-if, we need the current stint deg
    driver_strategy = get_driver_strategy(session_key, req.driver)
    
    current_stint = driver_strategy.stints[-1] if driver_strategy.stints else None
    current_deg = driver_strategy.deg_results[-1].dict() if driver_strategy.deg_results else {}
    
    result = what_if_engine.simulate_alternate_pit(
        driver=req.driver.upper(),
        actual_pit_lap=req.actual_pit_lap,
        hypothetical_pit_lap=req.hypothetical_pit_lap,
        driver_laps=all_laps,
        current_stint_deg=current_deg
    )
    return result


from pydantic import BaseModel

class DebriefRequest(BaseModel):
    query: str | None = None

@app.get("/api/sessions/{session_key}/debrief/{driver}")
def get_ai_debrief_endpoint(session_key: str, driver: str):
    """Generate an AI Strategy debrief using IBM Granite."""
    from backend.intelligence.debrief import get_ai_debrief
    result = get_ai_debrief(session_key, driver)
    if "error" in result:
        raise HTTPException(500, result["error"])
    return result

@app.post("/api/sessions/{session_key}/debrief/{driver}")
def post_ai_debrief_endpoint(session_key: str, driver: str, req: DebriefRequest):
    """Generate an AI Strategy debrief using IBM Granite with a custom query."""
    from backend.intelligence.debrief import get_ai_debrief
    result = get_ai_debrief(session_key, driver, req.query)
    if "error" in result:
        raise HTTPException(500, result["error"])
    return result


# ── Replay ──────────────────────────────────────────────────

race_replay = RaceReplay()

# In-memory cache so we don't recompute frames on every request
_replay_cache: dict[str, dict] = {}


@app.get("/api/sessions/{session_key}/replay")
def get_replay(session_key: str):
    """Get pre-built replay frames for a session.

    Returns all lap frames in a dict keyed by lap number.
    The frontend can jump to any lap in O(1).
    """
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")

    # Serve from cache if available
    if session_key in _replay_cache:
        return {"session_key": session_key, "frames": _replay_cache[session_key]}

    all_laps = database.get_laps(session_key)
    if not all_laps:
        raise HTTPException(404, "No lap data found for session")

    frames = race_replay.build_frames(session_key, all_laps)
    _replay_cache[session_key] = frames

    return {
        "session_key": session_key,
        "total_laps": len(frames),
        "frames": frames,
    }


@app.get("/api/sessions/{session_key}/replay/events")
def get_replay_events(session_key: str):
    """Get just the events list (pit stops, overtakes, SC) for a session."""
    if not database.session_exists(session_key):
        raise HTTPException(404, "Session not found")

    all_laps = database.get_laps(session_key)
    if not all_laps:
        raise HTTPException(404, "No lap data found for session")

    from backend.replay import EventDetector
    detector = EventDetector()
    events = detector.detect(all_laps)
    return {
        "session_key": session_key,
        "count": len(events),
        "events": [e.dict() for e in events],
    }
