"""
PitLane IQ — Undercut Analyser
Computes the threat of an undercut from a rival driver.
"""

from backend.models import UnderCutThreat
import pandas as pd
import numpy as np

class UnderCutAnalyser:
    def __init__(self):
        pass

    def compute_threat(self, driver: str, rival: str, driver_laps: list[dict], rival_laps: list[dict], current_lap: int) -> UnderCutThreat:
        """
        Computes the undercut threat score (0-100) based on:
        - Gap delta trend (is the rival catching?)
        - Tyre age delta (does the rival have newer/older tyres?)
        - Deg rate delta (is the driver's pace dropping off faster?)
        """
        # We need at least a few laps to compute trends
        if len(driver_laps) < 3 or len(rival_laps) < 3:
            return UnderCutThreat(
                driver=driver,
                rival=rival,
                score=0.0,
                urgency="none"
            )
            
        # Convert to DataFrame for easier manipulation
        df_driver = pd.DataFrame(driver_laps)
        df_rival = pd.DataFrame(rival_laps)

        # Ensure lap numbers align
        common_laps = set(df_driver['lap_number']).intersection(set(df_rival['lap_number']))
        
        # We only care about laps up to current_lap
        recent_laps = sorted([l for l in common_laps if l <= current_lap])[-5:] # Last 5 laps max
        
        if len(recent_laps) < 2:
            return UnderCutThreat(driver=driver, rival=rival, score=0.0, urgency="none")
            
        # Calculate gap trend (driver lap time - rival lap time)
        # If rival is faster, gap delta is positive (driver time > rival time)
        dr_recent = df_driver[df_driver['lap_number'].isin(recent_laps)].sort_values('lap_number')
        rv_recent = df_rival[df_rival['lap_number'].isin(recent_laps)].sort_values('lap_number')
        
        # Align series
        lap_times_dr = dr_recent['lap_time'].values
        lap_times_rv = rv_recent['lap_time'].values
        
        if len(lap_times_dr) != len(lap_times_rv) or len(lap_times_dr) < 2:
             return UnderCutThreat(driver=driver, rival=rival, score=0.0, urgency="none")
             
        import math
        
        # Average time difference over recent laps, ignoring NaNs
        time_deltas = np.array(lap_times_dr, dtype=float) - np.array(lap_times_rv, dtype=float)
        
        # Positive trend means rival is catching
        with np.errstate(invalid='ignore'):
            avg_delta = np.nanmean(time_deltas)
            
        if math.isnan(avg_delta):
            avg_delta = 0.0

        gap_delta_score = min(max((avg_delta * 50), 0), 100) # 1s faster = 50 score, 2s = 100
        
        # Tyre age delta
        current_dr_lap = dr_recent.iloc[-1]
        current_rv_lap = rv_recent.iloc[-1]
        
        tyre_age_dr = current_dr_lap.get('tyre_life', 0) or 0
        tyre_age_rv = current_rv_lap.get('tyre_life', 0) or 0
        
        age_delta = tyre_age_dr - tyre_age_rv
        # If driver has older tyres, threat increases
        tyre_age_score = min(max((age_delta * 5), 0), 100) # 20 laps older = 100 score
        
        # Deg rate delta (simplified approximation over last 5 laps)
        # Drop NaNs before polyfit
        valid_dr = ~np.isnan(np.array(lap_times_dr, dtype=float))
        valid_rv = ~np.isnan(np.array(lap_times_rv, dtype=float))
        valid_mask = valid_dr & valid_rv
        x = np.arange(len(lap_times_dr))[valid_mask]
        
        if len(x) > 1:
            slope_dr, _ = np.polyfit(x, np.array(lap_times_dr, dtype=float)[valid_mask], 1)
            slope_rv, _ = np.polyfit(x, np.array(lap_times_rv, dtype=float)[valid_mask], 1)
            deg_delta = slope_dr - slope_rv
        else:
            deg_delta = 0
            
        deg_rate_score = min(max((deg_delta * 500), 0), 100) # 0.2s/lap diff = 100 score
        
        # Final Formula: gap_delta_trend × 0.4 + tyre_age_delta × 0.35 + deg_rate_delta × 0.25
        score = (gap_delta_score * 0.4) + (tyre_age_score * 0.35) + (deg_rate_score * 0.25)
        if math.isnan(score):
            score = 0.0
        score = min(max(score, 0), 100)
        
        # Determine urgency
        if score >= 85:
            urgency = "critical"
        elif score >= 60:
            urgency = "act"
        elif score >= 35:
            urgency = "watch"
        else:
            urgency = "none"
            
        return UnderCutThreat(
            driver=driver,
            rival=rival,
            score=round(float(score), 2),
            urgency=urgency,
            projected_position_loss=1 if urgency in ["act", "critical"] else 0,
            trigger_lap_estimate=int(current_lap) + 1 if urgency == "critical" else (int(current_lap) + 3 if urgency == "act" else None),
            gap_delta_trend=round(float(avg_delta), 3)
        )
