"""
PitLane IQ — Session Loader
Loads F1 sessions from FastF1 and caches them to SQLite.
"""

import logging
from typing import Optional

import fastf1
import pandas as pd

from backend.config import settings
from backend import database
from backend.telemetry.processor import LapProcessor

logger = logging.getLogger(__name__)


def _init_fastf1_cache():
    """Enable FastF1 disk cache."""
    cache_path = settings.fastf1_cache_abs_path
    fastf1.Cache.enable_cache(str(cache_path))
    logger.info(f"FastF1 cache enabled at: {cache_path}")


# Initialize cache on module import
_init_fastf1_cache()


def make_session_key(year: int, round_num: int, session_type: str) -> str:
    """Generate a unique session key."""
    return f"{year}_{round_num}_{session_type}"


def get_event_schedule(year: int) -> list[dict]:
    """Get the event schedule for a given year.

    Returns list of {round, gp_name, country, date}.
    """
    try:
        schedule = fastf1.get_event_schedule(year)
        events = []
        for _, row in schedule.iterrows():
            round_num = int(row.get("RoundNumber", 0))
            if round_num < 1:
                continue
            events.append({
                "round": round_num,
                "gp_name": str(row.get("EventName", "")),
                "country": str(row.get("Country", "")),
                "date": str(row.get("EventDate", "")),
            })
        return events
    except Exception as e:
        logger.error(f"Failed to get schedule for {year}: {e}")
        return []


def load_session(year: int, round_num: int, session_type: str,
                 force_reload: bool = False) -> dict:
    """Load a session from FastF1, process it, and cache to SQLite.

    Returns session metadata dict.
    Raises ValueError if session can't be loaded.
    """
    session_key = make_session_key(year, round_num, session_type)

    # Check if already cached
    if not force_reload and database.session_exists(session_key):
        cached = database.get_session(session_key)
        if cached:
            logger.info(f"Session {session_key} loaded from cache")
            return cached

    logger.info(f"Loading session {session_key} from FastF1...")

    try:
        session = fastf1.get_session(year, round_num, session_type)
        session.load(
            laps=True,
            telemetry=False,  # Don't load telemetry upfront — it's huge
            weather=False,
            messages=False,
        )
    except Exception as e:
        raise ValueError(f"Failed to load session: {e}")

    # Extract basic metadata
    gp_name = str(session.event.get("EventName", f"Round {round_num}"))
    laps_df = session.laps

    if laps_df is None or laps_df.empty:
        raise ValueError(f"No lap data available for {session_key}")

    # Process laps
    processor = LapProcessor()
    processed_laps = processor.process(laps_df)

    if not processed_laps:
        raise ValueError(f"No valid laps after processing for {session_key}")

    # Get driver list and total laps
    drivers = sorted(set(l["driver"] for l in processed_laps))
    total_laps = max(l["lap_number"] for l in processed_laps)

    # Save to database
    database.save_session(
        session_key=session_key,
        year=year,
        round_num=round_num,
        gp_name=gp_name,
        session_type=session_type,
        total_laps=total_laps,
        drivers=drivers,
    )
    database.save_laps(session_key, processed_laps)

    logger.info(
        f"Session {session_key} loaded: {gp_name}, "
        f"{len(drivers)} drivers, {total_laps} laps, "
        f"{len(processed_laps)} lap records"
    )

    return {
        "session_key": session_key,
        "year": year,
        "round": round_num,
        "gp_name": gp_name,
        "session_type": session_type,
        "total_laps": total_laps,
        "drivers": drivers,
        "loaded_at": database.get_session(session_key)["loaded_at"],
    }


def load_telemetry(year: int, round_num: int, session_type: str,
                   driver: str, lap_number: int) -> list[dict]:
    """Load detailed telemetry for a specific driver/lap.

    This is loaded on-demand because telemetry data is very large.
    Returns list of TelemetryPoint dicts.
    """
    try:
        session = fastf1.get_session(year, round_num, session_type)
        session.load(laps=True, telemetry=True, weather=False, messages=False)

        driver_laps = session.laps.pick_drivers(driver)
        lap = driver_laps[driver_laps["LapNumber"] == lap_number]

        if lap.empty:
            return []

        tel = lap.iloc[0].get_telemetry()
        if tel is None or tel.empty:
            return []

        points = []
        for _, row in tel.iterrows():
            points.append({
                "distance": float(row.get("Distance", 0)),
                "speed": float(row.get("Speed", 0)),
                "throttle": float(row.get("Throttle", 0)),
                "brake": float(row.get("Brake", 0)),
                "gear": int(row.get("nGear", 0)),
                "drs": int(row.get("DRS", 0)),
                "rpm": float(row.get("RPM", 0)) if pd.notna(row.get("RPM")) else None,
            })
        return points

    except Exception as e:
        logger.error(f"Failed to load telemetry: {e}")
        return []
