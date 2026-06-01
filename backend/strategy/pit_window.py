"""
PitLane IQ — Pit Window Calculator
Calculates the optimal pit window based on tyre degradation and undercut threats.
"""

from backend.models import PitWindow, TyreDegResult, UnderCutThreat
from typing import Optional

class PitWindowCalculator:
    def __init__(self):
        pass

    def compute_window(self, driver: str, current_lap: int, deg_result: TyreDegResult, undercut_threats: list[UnderCutThreat]) -> PitWindow:
        """
        Computes the optimal pit lap considering: tyre cliff, undercut threat.
        """
        # Base window is around the predicted cliff lap
        cliff_lap = deg_result.predicted_cliff_lap
        
        # If no cliff lap can be predicted yet, we return a wide/low-confidence window
        if not cliff_lap:
            return PitWindow(
                driver=driver,
                optimal_lap_range=(current_lap + 10, current_lap + 15),
                urgency="none",
                projected_gain_seconds=0.0,
                confidence=0.2
            )
            
        # Default range is [cliff - 2, cliff + 1]
        start_range = max(current_lap + 1, cliff_lap - 2)
        end_range = max(start_range + 3, cliff_lap + 1)
        
        urgency = "none"
        projected_gain = 0.0
        confidence = deg_result.r2_score if deg_result.r2_score > 0 else 0.5
        
        # Adjust based on undercut threats
        critical_threats = [t for t in undercut_threats if t.urgency == "critical"]
        act_threats = [t for t in undercut_threats if t.urgency == "act"]
        
        if critical_threats:
            # We need to pit immediately to defend
            start_range = current_lap + 1
            end_range = current_lap + 2
            urgency = "critical"
            # Defending an undercut saves the pit loss time equivalent of track position
            projected_gain = 2.0 
            confidence += 0.2
            
        elif act_threats:
            # Shift window earlier
            start_range = max(current_lap + 1, start_range - 2)
            end_range = max(start_range + 2, end_range - 2)
            urgency = "act"
            projected_gain = 1.0
            confidence += 0.1
            
        elif current_lap >= cliff_lap:
            # We are past the cliff, pit immediately
            start_range = current_lap + 1
            end_range = current_lap + 2
            urgency = "act"
            projected_gain = deg_result.deg_rate_per_lap * 5 # Roughly saving 5 laps of heavy deg
            
        elif (cliff_lap - current_lap) <= 3:
            urgency = "watch"
            projected_gain = 0.5
            
        confidence = min(max(confidence, 0.0), 1.0)
            
        return PitWindow(
            driver=driver,
            optimal_lap_range=(start_range, end_range),
            urgency=urgency,
            projected_gain_seconds=round(projected_gain, 2),
            confidence=round(confidence, 2)
        )
