"""
PitLane IQ — Frame Builder
Builds a lap-by-lap RaceFrame dictionary for the replay engine.
Each frame contains: positions, gaps, tyre compounds, tyre life, events, safety car flag.
Pre-built for O(1) frontend lookup by lap number.
"""

import logging
from typing import Optional
from backend.models import RaceFrame, RaceEvent
from backend.replay.event_detector import EventDetector

logger = logging.getLogger(__name__)


class RaceReplay:
    """Builds and caches replay frames for a session."""

    def __init__(self):
        self.event_detector = EventDetector()

    def build_frames(self, session_key: str, all_laps: list[dict]) -> dict[int, dict]:
        """
        Constructs a frame for every lap in the race.

        Args:
            session_key: Unique session identifier.
            all_laps: Flat list of all lap dicts from the database (all drivers).

        Returns:
            Dict mapping lap_number → RaceFrame dict, ready for JSON serialization.
        """
        if not all_laps:
            logger.warning(f"No laps found for session {session_key}")
            return {}

        # Detect all events for this session
        events = self.event_detector.detect(all_laps)

        # Group events by lap for O(1) lookup
        events_by_lap: dict[int, list[RaceEvent]] = {}
        for event in events:
            if event.lap not in events_by_lap:
                events_by_lap[event.lap] = []
            events_by_lap[event.lap].append(event)

        # Identify safety car laps
        sc_laps: set[int] = {
            e.lap for e in events if e.type == "safety_car"
        }

        # Group laps by driver, sorted by lap_number
        laps_by_driver: dict[str, list[dict]] = {}
        for lap in all_laps:
            d = lap.get("driver", "")
            if d not in laps_by_driver:
                laps_by_driver[d] = []
            laps_by_driver[d].append(lap)

        for d in laps_by_driver:
            laps_by_driver[d].sort(key=lambda x: x.get("lap_number", 0))

        # Determine overall race lap range
        all_lap_numbers = sorted(set(l.get("lap_number", 0) for l in all_laps))
        if not all_lap_numbers:
            return {}

        frames: dict[int, dict] = {}

        for lap_num in all_lap_numbers:
            positions, gaps = self._compute_positions_and_gaps(laps_by_driver, lap_num)
            
            tyre_compounds: dict[str, str] = {}
            tyre_life: dict[str, int] = {}

            # Build the state at this lap from each driver's most recent data
            for driver, driver_laps in laps_by_driver.items():
                lap_data = self._find_lap(driver_laps, lap_num)

                if lap_data is None:
                    # Use most recent lap before this one (driver may have retired)
                    lap_data = self._find_latest_before(driver_laps, lap_num)

                if lap_data is None:
                    continue

                compound = lap_data.get("compound")
                if compound:
                    tyre_compounds[driver] = compound

                t_life = lap_data.get("tyre_life")
                if t_life is not None:
                    tyre_life[driver] = int(t_life)

            # Build the frame
            frame = RaceFrame(
                lap=lap_num,
                positions=positions,
                gaps=gaps,
                events=events_by_lap.get(lap_num, []),
                tyre_compounds=tyre_compounds,
                tyre_life=tyre_life,
                safety_car=(lap_num in sc_laps)
            )

            frames[lap_num] = frame.dict()

        logger.info(
            f"Built {len(frames)} replay frames for session {session_key} "
            f"with {len(events)} events"
        )
        return frames

    # ── Helpers ───────────────────────────────────────────────

    def _find_lap(self, driver_laps: list[dict], lap_num: int) -> Optional[dict]:
        """Find exact lap data for a given lap number."""
        for lap in driver_laps:
            if lap.get("lap_number") == lap_num:
                return lap
        return None

    def _find_latest_before(self, driver_laps: list[dict], lap_num: int) -> Optional[dict]:
        """Find the most recent lap data at or before a given lap number."""
        best = None
        for lap in driver_laps:
            ln = lap.get("lap_number", 0)
            if ln <= lap_num:
                if best is None or ln > best.get("lap_number", 0):
                    best = lap
        return best

    def _compute_positions_and_gaps(
        self,
        laps_by_driver: dict[str, list[dict]],
        lap_num: int
    ) -> tuple[dict[str, int], dict[str, Optional[float]]]:
        """
        Compute positions and approximate gaps to race leader.
        Sorts drivers by completed laps (desc) and cumulative time (asc).
        """
        driver_stats = []

        for driver, driver_laps in laps_by_driver.items():
            total_time = 0.0
            completed_laps = 0
            for lap in driver_laps:
                if lap.get("lap_number", 0) > lap_num:
                    break
                t = lap.get("lap_time")
                if not t:
                    s1 = lap.get("sector1") or 0.0
                    s2 = lap.get("sector2") or 0.0
                    s3 = lap.get("sector3") or 0.0
                    if s1 > 0 and s2 > 0 and s3 > 0:
                        t = s1 + s2 + s3
                        
                if t:
                    total_time += t
                completed_laps = lap.get("lap_number", 0)
                
            if completed_laps > 0:
                driver_stats.append({
                    "driver": driver,
                    "completed_laps": completed_laps,
                    "total_time": total_time
                })

        # Sort: Most laps completed first, then smallest total time
        driver_stats.sort(key=lambda x: (-x["completed_laps"], x["total_time"]))

        positions = {}
        gaps = {}

        if not driver_stats:
            return positions, gaps

        leader = driver_stats[0]
        leader_laps = leader["completed_laps"]
        leader_time = leader["total_time"]

        for i, stat in enumerate(driver_stats):
            driver = stat["driver"]
            positions[driver] = i + 1  # 1-indexed position

            if stat["completed_laps"] == leader_laps:
                # Same lap as leader -> compute time gap
                gap = stat["total_time"] - leader_time
                gaps[driver] = round(gap, 3)
            else:
                # Lapped or DNF -> no pure time gap to leader
                gaps[driver] = None

        return positions, gaps
