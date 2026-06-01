import { LapData, SessionStrategy, UnderCutThreat } from '../types/api';

/**
 * Normalized UI representations
 */
export interface NormalizedDriver {
  code: string;
  pos: number;
  gapToLeader: string; // "+1.2s" or "LEADER"
  tyreCompound: string; // "S", "M", "H"
  tyreLife: number;
  status: 'pit_open' | 'watch' | 'critical' | 'none';
  pitStops: number;
}

export interface NormalizedChartPoint {
  lap: number;
  [driverCode: string]: number; // the gap in seconds for the chart
}

/**
 * Converts raw FastF1 lap and strategy data into the specific structures
 * required by our frontend components (DriverTable, GapChart).
 */
export class StrategyAdapter {
  /**
   * Builds the DriverTable data structure.
   */
  static normalizeDriverTable(
    laps: LapData[], 
    strategy: SessionStrategy | null, 
    currentLap: number
  ): NormalizedDriver[] {
    // 1. Compute stats per driver up to currentLap
    const driverStats = new Map<string, { completedLaps: number, totalTime: number, lapData: LapData }>();

    // Sort laps chronologically first to ensure we sum correctly
    const sortedLaps = [...laps].sort((a, b) => a.lap_number - b.lap_number);

    for (const lap of sortedLaps) {
      if (lap.lap_number <= currentLap) {
        let stats = driverStats.get(lap.driver) || { completedLaps: 0, totalTime: 0, lapData: lap };
        
        let t = lap.lap_time;
        if (!t || t <= 0) {
          const s1 = lap.sector1 || 0;
          const s2 = lap.sector2 || 0;
          const s3 = lap.sector3 || 0;
          if (s1 > 0 && s2 > 0 && s3 > 0) t = s1 + s2 + s3;
        }
        
        if (t && t > 0) {
          stats.totalTime += t;
        }
        
        // Update to the latest lap data object we have processed
        stats.completedLaps = lap.lap_number;
        stats.lapData = lap;
        
        driverStats.set(lap.driver, stats);
      }
    }

    const currentLapData = Array.from(driverStats.values());
    if (currentLapData.length === 0) return [];

    // 2. Sort by actual race position (most laps, then shortest time)
    currentLapData.sort((a, b) => {
      if (b.completedLaps !== a.completedLaps) {
        return b.completedLaps - a.completedLaps;
      }
      return a.totalTime - b.totalTime;
    });

    const leader = currentLapData[0];

    // 3. Map to UI structure
    return currentLapData.map((stat, index) => {
      const lap = stat.lapData;
      const pos = index + 1;

      // Find strategy status for this driver
      let status: 'pit_open' | 'watch' | 'critical' | 'none' = 'none';
      if (strategy && strategy.drivers && strategy.drivers[lap.driver]) {
        const driverStrat = strategy.drivers[lap.driver];
        if (driverStrat.undercut_threats && driverStrat.undercut_threats.length > 0) {
          const criticalThreat = driverStrat.undercut_threats.find(t => t.urgency === 'critical');
          const actThreat = driverStrat.undercut_threats.find(t => t.urgency === 'act');
          const watchThreat = driverStrat.undercut_threats.find(t => t.urgency === 'watch');

          if (criticalThreat) status = 'critical';
          else if (actThreat || watchThreat) status = 'watch';
          else status = 'pit_open';
        }
      }

      // Format gap
      let gapStr = '...';
      if (pos === 1) {
        gapStr = 'LEADER';
      } else {
        if (stat.completedLaps === leader.completedLaps) {
          const gap = stat.totalTime - leader.totalTime;
          gapStr = `+${gap.toFixed(2)}s`;
        } else {
          // They are lapped or DNF
          const lapsDown = leader.completedLaps - stat.completedLaps;
          gapStr = `+${lapsDown} LAP${lapsDown > 1 ? 'S' : ''}`;
        }
      }

      return {
        code: lap.driver,
        pos: pos,
        gapToLeader: gapStr,
        tyreCompound: lap.compound?.[0] || 'M', 
        tyreLife: lap.tyre_life || 0,
        status,
        pitStops: 0
      };
    });
  }

  /**
   * Transforms raw laps into the structure expected by Recharts (GapChart).
   * Array of { lap: 1, VER: 0, HAM: -1.2, NOR: -2.5 }
   */
  static normalizeGapChart(laps: LapData[], driversToInclude: string[]): NormalizedChartPoint[] {
    const byLap: Record<number, NormalizedChartPoint> = {};

    // Group laps by lap number
    const lapsByLapNumber = new Map<number, LapData[]>();
    laps.forEach(lap => {
      if (!lapsByLapNumber.has(lap.lap_number)) {
        lapsByLapNumber.set(lap.lap_number, []);
      }
      lapsByLapNumber.get(lap.lap_number)!.push(lap);
    });

    const maxLap = Math.max(...Array.from(lapsByLapNumber.keys()));
    const cumulativeTimes = new Map<string, number>();

    for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
      const lapsForThisNum = lapsByLapNumber.get(lapNum) || [];
      
      // Add cumulative times for drivers who completed this lap
      for (const lap of lapsForThisNum) {
        let t = lap.lap_time;
        if (!t || t <= 0) {
          const s1 = lap.sector1 || 0;
          const s2 = lap.sector2 || 0;
          const s3 = lap.sector3 || 0;
          if (s1 > 0 && s2 > 0 && s3 > 0) t = s1 + s2 + s3;
        }
        
        if (t && t > 0) {
          const currentCumul = cumulativeTimes.get(lap.driver) || 0;
          cumulativeTimes.set(lap.driver, currentCumul + t);
        }
      }

      // Find leader for this lap
      let leaderTime = Number.MAX_VALUE;
      for (const lap of lapsForThisNum) {
        const c = cumulativeTimes.get(lap.driver);
        if (c && c < leaderTime) {
          leaderTime = c;
        }
      }

      if (leaderTime === Number.MAX_VALUE) continue;

      const chartPoint: NormalizedChartPoint = { lap: lapNum };
      
      // Calculate gap for requested drivers
      for (const lap of lapsForThisNum) {
        if (!driversToInclude.includes(lap.driver)) continue;
        
        const myTime = cumulativeTimes.get(lap.driver);
        if (myTime) {
          let gap = leaderTime - myTime; // Negative if behind
          // Cap the gap at -60s so chart is readable
          if (gap < -60) gap = -60;
          chartPoint[lap.driver] = Number(gap.toFixed(2));
        }
      }

      // Only push if there's data for requested drivers
      if (Object.keys(chartPoint).length > 1) {
        byLap[lapNum] = chartPoint;
      }
    }

    return Object.values(byLap).sort((a, b) => a.lap - b.lap);
  }

  /**
   * Normalizes lap data for the Tyre Degradation panel for a specific driver.
   * Plots estimated wear % or tyre age over time per compound stint.
   */
  static normalizeTyreDegChart(laps: LapData[], driverCode: string) {
    const driverLaps = laps.filter(l => l.driver === driverCode).sort((a, b) => a.lap_number - b.lap_number);
    
    const chartData: any[] = [];
    const stintsInfo: { compound: string; maxLife: number; laps: number }[] = [];
    
    let currentStintLaps = 0;

    driverLaps.forEach(lap => {
      const comp = lap.compound || 'M';
      // FastF1 typically returns 'SOFT', 'MEDIUM', 'HARD', etc.
      const compName = `${comp} TYRE`.toUpperCase();

      // Estimate wear based on tyre life. 
      // Very rough F1 estimates: Soft ~25 laps, Medium ~35, Hard ~45.
      let expectedMax = 35;
      if (comp.startsWith('S')) expectedMax = 25;
      if (comp.startsWith('H')) expectedMax = 45;
      if (comp.startsWith('I') || comp.startsWith('W')) expectedMax = 30;

      const wearPct = Math.min(100, ((lap.tyre_life || 0) / expectedMax) * 100);

      const dataPoint: any = { lap: lap.lap_number };
      dataPoint[compName] = Number(wearPct.toFixed(1));
      chartData.push(dataPoint);

      currentStintLaps = lap.tyre_life || 0;
      
      // Update stints info
      const lastStint = stintsInfo[stintsInfo.length - 1];
      if (!lastStint || lastStint.compound !== compName) {
        stintsInfo.push({ compound: compName, maxLife: expectedMax, laps: lap.tyre_life || 0 });
      } else {
        lastStint.laps = lap.tyre_life || 0;
      }
    });

    return { chartData, stintsInfo };
  }
}
