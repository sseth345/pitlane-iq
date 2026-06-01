"""
PitLane IQ — Tyre Degradation Model
Calculates the tyre degradation per lap (seconds) and predicts the cliff lap.
"""

from typing import List
import numpy as np
from scipy import stats
import pandas as pd
from backend.models import LapData, TyreDegResult

class TyreDegModel:
    def __init__(self):
        self.fuel_effect_per_lap = -0.03 # Roughly 0.03s faster per lap due to fuel burn
        
    def fit(self, driver: str, stint: int, compound: str, laps: List[LapData]) -> TyreDegResult:
        """
        Fits a linear regression model on the lap times vs tyre life,
        accounting for fuel burn.
        """
        if len(laps) < 3:
            return TyreDegResult(
                driver=driver,
                stint=stint,
                compound=compound,
                deg_rate_per_lap=0.0,
                base_pace=0.0,
                r2_score=0.0,
                predicted_cliff_lap=None,
                laps_fitted=len(laps)
            )
            
        times = []
        lives = []
        lap_nums = []
        
        for lap in laps:
            if lap.is_valid and lap.lap_time and lap.tyre_life:
                times.append(lap.lap_time)
                lives.append(lap.tyre_life)
                lap_nums.append(lap.lap_number)
                
        if len(times) < 3:
             return TyreDegResult(
                driver=driver,
                stint=stint,
                compound=compound,
                deg_rate_per_lap=0.0,
                base_pace=0.0,
                r2_score=0.0,
                predicted_cliff_lap=None,
                laps_fitted=len(times)
            )
             
        times_arr = np.array(times)
        lives_arr = np.array(lives)
        lap_nums_arr = np.array(lap_nums)
        
        # Remove outlier laps (VSC, traffic, mistakes)
        median_time = np.median(times_arr)
        valid_idx = times_arr < (median_time * 1.05)
        
        valid_times = times_arr[valid_idx]
        valid_lives = lives_arr[valid_idx]
        valid_lap_nums = lap_nums_arr[valid_idx]
        
        if len(valid_times) < 3:
             return TyreDegResult(
                driver=driver,
                stint=stint,
                compound=compound,
                deg_rate_per_lap=0.0,
                base_pace=0.0,
                r2_score=0.0,
                predicted_cliff_lap=None,
                laps_fitted=len(valid_times)
            )
             
        # Remove fuel effect (adjust times to what they would be with start-of-race fuel)
        # Lap 1 has max fuel, Lap 50 has min fuel.
        # So we ADD time to later laps to normalize them against tyre life.
        normalized_times = valid_times - (valid_lap_nums * self.fuel_effect_per_lap)
        
        res = stats.linregress(valid_lives, normalized_times)
        deg_rate = float(res.slope) # type: ignore
        base_pace = float(res.intercept) # type: ignore
        r_value = float(res.rvalue) # type: ignore
        
        # Predict cliff lap: Typically when tyre loses more than 1.5s vs base pace
        # Or just a hardcoded age based on compound for the MVP
        cliff_threshold = 1.5
        predicted_cliff_age = None
        predicted_cliff_lap = None
        
        if deg_rate > 0:
            predicted_cliff_age = cliff_threshold / deg_rate
            
        if predicted_cliff_age:
            # Cliff lap = current_lap + (cliff_age - current_age)
            current_lap = int(valid_lap_nums[-1])
            current_age = int(valid_lives[-1])
            predicted_cliff_lap = int(current_lap + (predicted_cliff_age - current_age))
            
        return TyreDegResult(
            driver=driver,
            stint=stint,
            compound=compound,
            deg_rate_per_lap=deg_rate,
            base_pace=base_pace,
            r2_score=r_value**2,
            predicted_cliff_lap=predicted_cliff_lap,
            laps_fitted=len(valid_times)
        )
