"""
PitLane IQ — Database Layer (Supabase Migration)
Connects to the managed PostgreSQL cluster via the official Supabase SDK.
"""

import os
from datetime import datetime
from typing import Optional
from supabase import create_client, Client
from backend.config import settings

# Initialize Supabase Client globally
supabase_url: str = os.environ.get("SUPABASE_URL", "")
supabase_key: str = os.environ.get("SUPABASE_KEY", "")

if not supabase_url or not supabase_key:
    # Allow import to succeed even if not configured (e.g. tests), 
    # but actual DB calls will fail if not set.
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)

def init_db():
    """No-op. Tables are created directly via Supabase SQL Editor."""
    pass

# ── Session CRUD ─────────────────────────────────────

def save_session(session_key: str, year: int, round_num: int,
                 gp_name: str, session_type: str, total_laps: int,
                 drivers: list[str]):
    """Insert or replace a session record."""
    if not supabase: return
    supabase.table("sessions").upsert({
        "session_key": session_key,
        "year": year,
        "round": round_num,
        "gp_name": gp_name,
        "session_type": session_type,
        "total_laps": total_laps,
        "drivers": drivers,
        "loaded_at": datetime.utcnow().isoformat()
    }).execute()

def get_session(session_key: str) -> Optional[dict]:
    """Get a session by key."""
    if not supabase: return None
    res = supabase.table("sessions").select("*").eq("session_key", session_key).maybe_single().execute()
    return res.data if res else None

def list_sessions() -> list[dict]:
    """List all cached sessions."""
    if not supabase: return []
    res = supabase.table("sessions").select("session_key, year, round, gp_name, session_type, loaded_at").order("year", desc=True).order("round", desc=True).execute()
    return res.data if res else []

def session_exists(session_key: str) -> bool:
    """Check if a session is already cached."""
    if not supabase: return False
    res = supabase.table("sessions").select("session_key").eq("session_key", session_key).maybe_single().execute()
    return (res is not None) and (res.data is not None)

# ── Lap CRUD ─────────────────────────────────────────

def save_laps(session_key: str, laps: list[dict]):
    """Bulk insert lap data."""
    if not supabase: return
    # Transform laps to match Supabase table 'lap_records'
    transformed = []
    for l in laps:
        transformed.append({
            "session_key": session_key,
            "driver": l["driver"],
            "lap_number": l["lap_number"],
            "lap_time": l.get("lap_time"),
            "sector1": l.get("sector1"),
            "sector2": l.get("sector2"),
            "sector3": l.get("sector3"),
            "compound": l.get("compound"),
            "tyre_life": l.get("tyre_life"),
            "stint": l.get("stint"),
            "position": l.get("position"),
            "is_pit_in": bool(l.get("is_pit_in", False)),
            "is_pit_out": bool(l.get("is_pit_out", False)),
            "speed_trap": l.get("speed_trap"),
            "is_valid": bool(l.get("is_valid", True))
        })
    
    if transformed:
        supabase.table("lap_records").upsert(transformed).execute()

def get_laps(session_key: str, driver: Optional[str] = None) -> list[dict]:
    """Get laps for a session, optionally filtered by driver."""
    if not supabase: return []
    query = supabase.table("lap_records").select("*").eq("session_key", session_key)
    if driver:
        query = query.eq("driver", driver)
    
    query = query.order("lap_number")
    res = query.execute()
    return res.data if res else []

# ── Strategy Cache ───────────────────────────────────

def save_strategy(session_key: str, strategy_dict: dict):
    """Cache the entire computed session strategy JSON."""
    if not supabase: return
    supabase.table("strategy_cache").upsert({
        "session_key": session_key,
        "strategy_json": strategy_dict,
        "computed_at": datetime.utcnow().isoformat()
    }).execute()

def get_strategy(session_key: str) -> Optional[dict]:
    """Get cached strategy data."""
    if not supabase: return None
    res = supabase.table("strategy_cache").select("*").eq("session_key", session_key).maybe_single().execute()
    if res and res.data:
        return res.data.get("strategy_json")
    return None

# ── Shadow Events ────────────────────────────────────

def save_shadow_events(session_key: str, events: list[dict]):
    """Save shadow intelligence events."""
    if not supabase: return
    transformed = []
    for e in events:
        transformed.append({
            "session_key": session_key,
            "lap": e["lap"],
            "driver": e.get("driver"),
            "message": e["message"],
            "confidence": e["confidence"],
            "category": e["category"],
            "surfaced": bool(e.get("surfaced", False))
        })
    if transformed:
        supabase.table("shadow_events").insert(transformed).execute()

def get_shadow_events(session_key: str, min_confidence: float = 0.0) -> list[dict]:
    """Get shadow events for a session."""
    if not supabase: return []
    res = supabase.table("shadow_events").select("*").eq("session_key", session_key).gte("confidence", min_confidence).order("lap").order("confidence", desc=True).execute()
    return res.data if res else []
