import pandas as pd
from backend.models import (
    DriverStrategy, SessionStrategy, StintData, TyreDegResult, UnderCutThreat, PitWindow, LapData
)
from backend import database
from backend.strategy import TyreDegModel, UnderCutAnalyser, PitWindowCalculator

class StrategyService:
    def __init__(self):
        self.deg_model = TyreDegModel()
        self.undercut_analyser = UnderCutAnalyser()
        self.pit_window_calc = PitWindowCalculator()

    def compute_session_strategy(self, session_key: str) -> SessionStrategy:
        session = database.get_session(session_key)
        if not session:
            return None

        all_laps_raw = database.get_laps(session_key)
        
        # Group laps by driver
        driver_laps_dict = {}
        for lap_raw in all_laps_raw:
            lap = LapData(**lap_raw)
            if lap.driver not in driver_laps_dict:
                driver_laps_dict[lap.driver] = []
            driver_laps_dict[lap.driver].append(lap)
            
        driver_strategies = {}
        
        # We need the current lap (max lap across all valid laps)
        current_lap = max(l["lap_number"] for l in all_laps_raw) if all_laps_raw else 1

        for driver, laps in driver_laps_dict.items():
            ds = self.compute_driver_strategy(driver, laps, driver_laps_dict, current_lap)
            driver_strategies[driver] = ds

        return SessionStrategy(
            session_key=session_key,
            drivers=driver_strategies
        )
        
    def compute_driver_strategy(self, driver: str, driver_laps: list[LapData], all_drivers_laps: dict[str, list[LapData]], current_lap: int) -> DriverStrategy:
        # 1. Identify stints
        stint_dict = {}
        for lap in driver_laps:
            if not lap.stint:
                continue
            if lap.stint not in stint_dict:
                stint_dict[lap.stint] = []
            stint_dict[lap.stint].append(lap)
            
        stints = []
        deg_results = []
        
        current_stint_num = max(stint_dict.keys()) if stint_dict else 1
        current_deg_result = None

        for stint_num, stint_laps in stint_dict.items():
            if not stint_laps:
                continue
                
            compound = stint_laps[0].compound or "UNKNOWN"
            start_lap = min(l.lap_number for l in stint_laps)
            end_lap = max(l.lap_number for l in stint_laps)
            tyre_life_start = min(l.tyre_life for l in stint_laps if l.tyre_life) if any(l.tyre_life for l in stint_laps) else 1
            tyre_life_end = max(l.tyre_life for l in stint_laps if l.tyre_life) if any(l.tyre_life for l in stint_laps) else 1
            
            valid_times = [l.lap_time for l in stint_laps if l.lap_time and l.is_valid]
            avg_time = sum(valid_times)/len(valid_times) if valid_times else None
            
            # Compute deg model for this stint
            deg_res = self.deg_model.fit(driver, stint_num, compound, stint_laps)
            deg_results.append(deg_res)
            
            if stint_num == current_stint_num:
                current_deg_result = deg_res

            stints.append(StintData(
                driver=driver,
                stint_number=stint_num,
                compound=compound,
                start_lap=start_lap,
                end_lap=end_lap,
                tyre_life_start=tyre_life_start,
                tyre_life_end=tyre_life_end,
                avg_lap_time=avg_time,
                deg_rate=deg_res.deg_rate_per_lap if deg_res else None
            ))
            
        # 2. Compute Undercut Threats
        threats = []
        # Convert LapData objects to dicts for undercut analyser
        driver_laps_dicts = [l.dict() for l in driver_laps]
        
        # Consider threats from drivers in close proximity. For simplicity here, we check all others.
        # In a real scenario, we'd filter by track gap < 3s.
        for rival, rival_laps in all_drivers_laps.items():
            if rival == driver:
                continue
            rival_laps_dicts = [l.dict() for l in rival_laps]
            threat = self.undercut_analyser.compute_threat(driver, rival, driver_laps_dicts, rival_laps_dicts, current_lap)
            if threat.urgency != "none":
                threats.append(threat)
                
        # 3. Compute Pit Window
        pit_windows = []
        if current_deg_result:
            pw = self.pit_window_calc.compute_window(driver, current_lap, current_deg_result, threats)
            pit_windows.append(pw)

        return DriverStrategy(
            driver=driver,
            stints=stints,
            deg_results=deg_results,
            undercut_threats=threats,
            pit_windows=pit_windows
        )
