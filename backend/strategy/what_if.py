"""
PitLane IQ — What-If Engine
Simulates alternate pit stop scenarios to see the projected outcome.
"""

from backend.models import WhatIfResult
from backend.strategy.deg_model import TyreDegModel
import pandas as pd
import numpy as np

class WhatIfEngine:
    def __init__(self):
        self.pit_loss_seconds = 22.0 # Average pit loss

    def simulate_alternate_pit(self, driver: str, actual_pit_lap: int, hypothetical_pit_lap: int, driver_laps: list[dict], current_stint_deg: dict) -> WhatIfResult:
        """
        Simulates the time and position delta if the driver had pitted on hypothetical_pit_lap instead.
        """
        # Very simplified model for MVP
        # 1. Calculate how much time would be gained/lost by staying out vs pitting
        # If hypothetical_pit_lap < actual_pit_lap, we pit earlier.
        # This means we get fresh tyres earlier, but they have to last longer.
        
        deg_rate = current_stint_deg.get("deg_rate_per_lap", 0.1)
        base_pace = current_stint_deg.get("base_pace", 90.0)
        
        lap_diff = actual_pit_lap - hypothetical_pit_lap
        
        if lap_diff == 0:
            return WhatIfResult(
                driver=driver,
                actual_pit_lap=actual_pit_lap,
                hypothetical_pit_lap=hypothetical_pit_lap,
                position_delta=0,
                time_delta=0.0,
                confidence=1.0,
                verdict="No change.",
                lap_details=[]
            )
            
        # If we pitted earlier (lap_diff > 0), we avoid deg on the old tyres for 'lap_diff' laps,
        # but our new tyres are 'lap_diff' laps older at the end of the race.
        # Time saved on old tyres = sum of deg_rate * age for those laps.
        # Time lost on new tyres = sum of new_deg_rate * age for the rest of the race.
        
        # Simplified:
        # Pitting 1 lap earlier saves ~ (current_tyre_age * deg_rate) seconds that lap.
        # But costs ~ (new_tyre_age * deg_rate) seconds on the last lap.
        
        # A rough heuristic for time delta:
        # Usually, the undercut is powerful because the old tyre is very slow (high age).
        # We assume the old tyre had age = actual_pit_lap - last_pit_lap (assume ~20 for now).
        # Let's approximate the time delta.
        
        assumed_old_tyre_age = 20
        assumed_new_tyre_age_at_end = 25 + lap_diff
        
        time_saved = lap_diff * (assumed_old_tyre_age * deg_rate)
        time_lost = lap_diff * (assumed_new_tyre_age_at_end * deg_rate)
        
        net_time_delta = time_saved - time_lost
        
        # Add a slight bias towards earlier stops (undercut advantage)
        if lap_diff > 0:
            net_time_delta += lap_diff * 0.5
            
        # Convert time delta to position delta (roughly 1 position per 2 seconds in a tight pack)
        position_delta = int(net_time_delta / 2.0)
        
        if net_time_delta > 0:
            verdict = f"Pitting on lap {hypothetical_pit_lap} would have gained ~{net_time_delta:.1f}s."
        else:
            verdict = f"Pitting on lap {hypothetical_pit_lap} would have cost ~{abs(net_time_delta):.1f}s."
            
        return WhatIfResult(
            driver=driver,
            actual_pit_lap=actual_pit_lap,
            hypothetical_pit_lap=hypothetical_pit_lap,
            position_delta=position_delta,
            time_delta=round(net_time_delta, 2),
            confidence=0.6,
            verdict=verdict,
            lap_details=[]
        )
