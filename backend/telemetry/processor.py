"""
PitLane IQ — Lap Data Processor
Cleans and transforms raw FastF1 lap data into structured records.
"""

import logging
from typing import Optional

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class LapProcessor:
    """Processes raw FastF1 lap DataFrame into clean lap records."""

    def process(self, laps_df: pd.DataFrame) -> list[dict]:
        """Process raw FastF1 laps DataFrame into list of lap dicts.

        Handles:
        - Timedelta → float seconds conversion
        - NaN handling
        - Stint detection
        - Pit in/out detection
        - Validity filtering
        """
        if laps_df is None or laps_df.empty:
            return []

        records = []
        for _, row in laps_df.iterrows():
            try:
                lap = self._process_row(row)
                if lap is not None:
                    records.append(lap)
            except Exception as e:
                logger.warning(f"Skipping lap: {e}")
                continue

        logger.info(f"Processed {len(records)} laps from {len(laps_df)} raw rows")
        return records

    def _process_row(self, row) -> Optional[dict]:
        """Process a single lap row."""
        driver = str(row.get("Driver", ""))
        lap_number = self._safe_int(row.get("LapNumber"))

        if not driver or lap_number is None or lap_number < 1:
            return None

        return {
            "driver": driver,
            "lap_number": lap_number,
            "lap_time": self._td_to_seconds(row.get("LapTime")),
            "sector1": self._td_to_seconds(row.get("Sector1Time")),
            "sector2": self._td_to_seconds(row.get("Sector2Time")),
            "sector3": self._td_to_seconds(row.get("Sector3Time")),
            "compound": self._safe_str(row.get("Compound")),
            "tyre_life": self._safe_int(row.get("TyreLife")),
            "stint": self._safe_int(row.get("Stint")),
            "position": self._safe_int(row.get("Position")),
            "is_pit_in": pd.notna(row.get("PitInTime")),
            "is_pit_out": pd.notna(row.get("PitOutTime")),
            "speed_trap": self._safe_float(row.get("SpeedST")),
            "is_valid": bool(row.get("IsAccurate", False)),
        }

    @staticmethod
    def _td_to_seconds(val) -> Optional[float]:
        """Convert timedelta to float seconds."""
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return None
        if isinstance(val, pd.Timedelta):
            total = val.total_seconds()
            if total <= 0 or total > 600:  # Sanity: no lap > 10 minutes
                return None
            return round(total, 3)
        try:
            return round(float(val), 3)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_int(val) -> Optional[int]:
        """Safely convert to int."""
        if val is None:
            return None
        try:
            if isinstance(val, float) and np.isnan(val):
                return None
            return int(val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_float(val) -> Optional[float]:
        """Safely convert to float."""
        if val is None:
            return None
        try:
            f = float(val)
            if np.isnan(f) or np.isinf(f):
                return None
            return round(f, 3)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_str(val) -> Optional[str]:
        """Safely convert to string."""
        if val is None:
            return None
        s = str(val)
        if s in ("nan", "None", ""):
            return None
        return s
