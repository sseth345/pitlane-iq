"""
PitLane IQ — Pydantic Models
All request/response schemas and data transfer objects.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Session ──────────────────────────────────────────

class LoadSessionRequest(BaseModel):
    year: int = Field(..., ge=2018, le=2026, description="Season year")
    round: int = Field(..., ge=1, description="Round number")
    session_type: str = Field(
        ...,
        pattern=r"^(FP1|FP2|FP3|Q|SQ|S|SS|R)$",
        description="Session type: FP1/FP2/FP3/Q/SQ/S/SS/R",
    )


class SessionInfo(BaseModel):
    session_key: str
    year: int
    round: int
    gp_name: str
    session_type: str
    total_laps: int
    drivers: list[str]
    loaded_at: str


class SessionListItem(BaseModel):
    session_key: str
    year: int
    round: int
    gp_name: str
    session_type: str
    loaded_at: str


# ── Lap Data ─────────────────────────────────────────

class LapData(BaseModel):
    driver: str
    lap_number: int
    lap_time: Optional[float] = None  # seconds
    sector1: Optional[float] = None
    sector2: Optional[float] = None
    sector3: Optional[float] = None
    compound: Optional[str] = None
    tyre_life: Optional[int] = None
    stint: Optional[int] = None
    position: Optional[int] = None
    is_pit_in: bool = False
    is_pit_out: bool = False
    speed_trap: Optional[float] = None
    is_valid: bool = True


class StintData(BaseModel):
    driver: str
    stint_number: int
    compound: str
    start_lap: int
    end_lap: int
    tyre_life_start: int
    tyre_life_end: int
    avg_lap_time: Optional[float] = None
    deg_rate: Optional[float] = None


# ── Telemetry ────────────────────────────────────────

class TelemetryPoint(BaseModel):
    distance: float
    speed: float
    throttle: float
    brake: float
    gear: int
    drs: int
    rpm: Optional[float] = None


# ── Strategy ─────────────────────────────────────────

class TyreDegResult(BaseModel):
    driver: str
    stint: int
    compound: str
    deg_rate_per_lap: float
    base_pace: float
    r2_score: float
    predicted_cliff_lap: Optional[int] = None
    laps_fitted: int


class UnderCutThreat(BaseModel):
    driver: str
    rival: str
    score: float = Field(..., ge=0, le=100)
    urgency: str  # none, watch, act, critical
    projected_position_loss: Optional[int] = None
    trigger_lap_estimate: Optional[int] = None
    gap_delta_trend: Optional[float] = None


class PitWindow(BaseModel):
    driver: str
    optimal_lap_range: tuple[int, int]
    urgency: str  # none, watch, act
    projected_gain_seconds: float
    confidence: float


class WhatIfRequest(BaseModel):
    driver: str
    actual_pit_lap: int
    hypothetical_pit_lap: int


class WhatIfResult(BaseModel):
    driver: str
    actual_pit_lap: int
    hypothetical_pit_lap: int
    position_delta: int  # positive = gained positions
    time_delta: float  # positive = gained time
    confidence: float
    verdict: str
    lap_details: list[dict] = []


# ── Replay ───────────────────────────────────────────

class RaceEvent(BaseModel):
    type: str  # overtake, pit_stop, safety_car, fastest_lap, incident
    lap: int
    driver: Optional[str] = None
    description: str
    significance: float = 0.5


class RaceFrame(BaseModel):
    lap: int
    positions: dict[str, int]  # driver → position
    gaps: dict[str, Optional[float]]  # driver → gap to leader
    events: list[RaceEvent] = []
    tyre_compounds: dict[str, str] = {}
    tyre_life: dict[str, int] = {}
    safety_car: bool = False


# ── Intelligence ─────────────────────────────────────

class ShadowInsight(BaseModel):
    message: str
    confidence: float = Field(..., ge=0, le=1)
    category: str  # undercut, tyre, gap, weather, strategy
    driver: Optional[str] = None
    lap: int
    surfaced: bool = False  # True if confidence > 0.85


class InsightCard(BaseModel):
    insight: ShadowInsight
    explanation: Optional[str] = None
    related_laps: list[int] = []


# ── Chat ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_key: str
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    citations: list[dict] = []
    session_key: str


# ── Strategy Summary ─────────────────────────────────

class DriverStrategy(BaseModel):
    driver: str
    stints: list[StintData]
    deg_results: list[TyreDegResult]
    undercut_threats: list[UnderCutThreat] = []
    pit_windows: list[PitWindow] = []


class SessionStrategy(BaseModel):
    session_key: str
    drivers: dict[str, DriverStrategy]
