"""
PitLane IQ — Event Detector
Scans lap data to detect race events: overtakes, pit stops, safety cars, fastest laps.
Each event has a type, lap, driver, description, and significance score.
"""

import logging
from typing import Optional
from backend.models import RaceEvent

logger = logging.getLogger(__name__)


class EventDetector:
    """Detects notable race events from raw lap data."""

    def detect(self, all_laps: list[dict]) -> list[RaceEvent]:
        """
        Main entry point. Processes all laps and returns a sorted list of RaceEvents.

        Args:
            all_laps: Flat list of lap dicts from database.get_laps(), all drivers.

        Returns:
            Sorted list of RaceEvent objects (sorted by lap number).
        """
        events: list[RaceEvent] = []

        # Group laps by lap_number for cross-driver analysis
        laps_by_number: dict[int, list[dict]] = {}
        for lap in all_laps:
            ln = lap.get("lap_number", 0)
            if ln not in laps_by_number:
                laps_by_number[ln] = []
            laps_by_number[ln].append(lap)

        # Group laps by driver for driver-specific analysis
        laps_by_driver: dict[str, list[dict]] = {}
        for lap in all_laps:
            d = lap.get("driver", "")
            if d not in laps_by_driver:
                laps_by_driver[d] = []
            laps_by_driver[d].append(lap)

        # Sort each driver's laps by lap number
        for d in laps_by_driver:
            laps_by_driver[d].sort(key=lambda x: x.get("lap_number", 0))

        # Run each detector
        events.extend(self._detect_pit_stops(laps_by_driver))
        events.extend(self._detect_overtakes(laps_by_number, laps_by_driver))
        events.extend(self._detect_fastest_laps(laps_by_driver))
        events.extend(self._detect_safety_cars(laps_by_number))

        # Sort all events by lap
        events.sort(key=lambda e: e.lap)

        logger.info(f"EventDetector found {len(events)} events total")
        return events

    # ── Pit Stop Detection ────────────────────────────────────

    def _detect_pit_stops(self, laps_by_driver: dict[str, list[dict]]) -> list[RaceEvent]:
        """Detect pit stops by looking for is_pit_in=True laps."""
        events = []
        for driver, laps in laps_by_driver.items():
            for lap in laps:
                if lap.get("is_pit_in"):
                    compound_after = self._get_compound_after_pit(laps, lap["lap_number"])
                    desc = f"{driver} pits"
                    if compound_after:
                        desc += f" → fits {compound_after}"
                    events.append(RaceEvent(
                        type="pit_stop",
                        lap=lap["lap_number"],
                        driver=driver,
                        description=desc,
                        significance=0.7
                    ))
        return events

    def _get_compound_after_pit(self, driver_laps: list[dict], pit_lap: int) -> Optional[str]:
        """Find the compound fitted after a pit stop."""
        for lap in driver_laps:
            if lap.get("lap_number", 0) > pit_lap and lap.get("is_pit_out"):
                return lap.get("compound")
        # Fallback: first lap after pit
        for lap in driver_laps:
            if lap.get("lap_number", 0) == pit_lap + 1:
                return lap.get("compound")
        return None

    # ── Overtake Detection ────────────────────────────────────

    def _detect_overtakes(self, laps_by_number: dict[int, list[dict]], laps_by_driver: dict[str, list[dict]]) -> list[RaceEvent]:
        """
        Detect position changes that are NOT caused by a pit stop on either side.
        A genuine overtake = driver improves position without pitting that lap or previous lap.
        """
        events = []

        # Build position history: {driver: {lap_number: position}}
        pos_history: dict[str, dict[int, int]] = {}
        for driver, laps in laps_by_driver.items():
            pos_history[driver] = {}
            for lap in laps:
                ln = lap.get("lap_number")
                pos = lap.get("position")
                if ln is not None and pos is not None:
                    pos_history[driver][ln] = pos

        # Build pit laps set for quick lookup
        pit_laps: set[tuple[str, int]] = set()
        for driver, laps in laps_by_driver.items():
            for lap in laps:
                if lap.get("is_pit_in") or lap.get("is_pit_out"):
                    pit_laps.add((driver, lap["lap_number"]))

        # Find position improvements
        all_lap_numbers = sorted(laps_by_number.keys())
        for i in range(1, len(all_lap_numbers)):
            curr_lap = all_lap_numbers[i]
            prev_lap = all_lap_numbers[i - 1]

            for driver in pos_history:
                curr_pos = pos_history[driver].get(curr_lap)
                prev_pos = pos_history[driver].get(prev_lap)

                if curr_pos is None or prev_pos is None:
                    continue

                # Position improved (lower is better)
                gained = prev_pos - curr_pos
                if gained <= 0:
                    continue

                # Filter out pit-stop-driven position changes
                driver_pitted = (
                    (driver, curr_lap) in pit_laps or
                    (driver, prev_lap) in pit_laps
                )
                if driver_pitted:
                    continue

                # Check who was overtaken (someone lost positions this lap)
                for rival in pos_history:
                    if rival == driver:
                        continue
                    rival_curr = pos_history[rival].get(curr_lap)
                    rival_prev = pos_history[rival].get(prev_lap)
                    if rival_curr is None or rival_prev is None:
                        continue
                    rival_pitted = (
                        (rival, curr_lap) in pit_laps or
                        (rival, prev_lap) in pit_laps
                    )
                    if rival_pitted:
                        continue

                    # Rival lost the exact positions this driver gained
                    rival_lost = rival_curr - rival_prev
                    if rival_lost >= gained:
                        desc = f"{driver} overtakes {rival} (P{prev_pos}→P{curr_pos})"
                        significance = min(0.5 + (gained * 0.1), 1.0)
                        # Only the first matching rival matters
                        events.append(RaceEvent(
                            type="overtake",
                            lap=curr_lap,
                            driver=driver,
                            description=desc,
                            significance=significance
                        ))
                        break

        return events

    # ── Fastest Lap Detection ─────────────────────────────────

    def _detect_fastest_laps(self, laps_by_driver: dict[str, list[dict]]) -> list[RaceEvent]:
        """Detect the single fastest lap of the race and fastest lap per driver."""
        events = []

        # Find the overall fastest lap
        fastest_time: Optional[float] = None
        fastest_driver: Optional[str] = None
        fastest_lap_num: Optional[int] = None

        for driver, laps in laps_by_driver.items():
            for lap in laps:
                t = lap.get("lap_time")
                if t and lap.get("is_valid"):
                    if fastest_time is None or t < fastest_time:
                        fastest_time = t
                        fastest_driver = driver
                        fastest_lap_num = lap.get("lap_number")

        if fastest_driver and fastest_lap_num and fastest_time:
            mins = int(fastest_time // 60)
            secs = fastest_time % 60
            events.append(RaceEvent(
                type="fastest_lap",
                lap=fastest_lap_num,
                driver=fastest_driver,
                description=f"{fastest_driver} sets fastest lap: {mins}:{secs:06.3f}",
                significance=0.9
            ))

        return events

    # ── Safety Car Detection ──────────────────────────────────

    def _detect_safety_cars(self, laps_by_number: dict[int, list[dict]]) -> list[RaceEvent]:
        """
        Detect safety car periods by looking for abnormally slow lap times across the field.
        Heuristic: if median lap time on a lap is >115% of the session median, it's likely SC/VSC.
        """
        events = []

        # Compute per-lap median times
        lap_medians: dict[int, float] = {}
        all_valid_times: list[float] = []

        for lap_num, laps in laps_by_number.items():
            valid_times = [l["lap_time"] for l in laps if l.get("lap_time") and l.get("is_valid")]
            if len(valid_times) >= 3:
                import statistics
                median = statistics.median(valid_times)
                lap_medians[lap_num] = median
                all_valid_times.extend(valid_times)

        if not all_valid_times:
            return events

        import statistics
        session_median = statistics.median(all_valid_times)
        sc_threshold = session_median * 1.15  # 15% above median = likely SC

        in_sc = False
        for lap_num in sorted(lap_medians.keys()):
            median = lap_medians[lap_num]
            if median > sc_threshold and not in_sc:
                in_sc = True
                events.append(RaceEvent(
                    type="safety_car",
                    lap=lap_num,
                    driver=None,
                    description=f"Safety Car / VSC period detected (lap {lap_num})",
                    significance=0.85
                ))
            elif median <= sc_threshold:
                in_sc = False

        return events
