/**
 * PitLane IQ — TypeScript API Definitions
 * Matches backend pydantic models precisely.
 */

export interface SessionInfo {
  session_key: string;
  year: number;
  round: number;
  gp_name: string;
  session_type: string;
  total_laps: number;
  drivers: string[];
  loaded_at: string;
}

export interface SessionListItem {
  session_key: string;
  year: number;
  round: number;
  gp_name: string;
  session_type: string;
  loaded_at: string;
}

export interface LapData {
  driver: string;
  lap_number: number;
  lap_time?: number;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  compound?: string;
  tyre_life?: number;
  stint?: number;
  position?: number;
  is_pit_in: boolean;
  is_pit_out: boolean;
  speed_trap?: number;
  is_valid: boolean;
}

export interface TyreDegResult {
  driver: string;
  stint: number;
  compound: string;
  deg_rate_per_lap: number;
  base_pace: number;
  r2_score: number;
  predicted_cliff_lap?: number;
  laps_fitted: number;
}

export interface UnderCutThreat {
  driver: string;
  rival: string;
  score: number;
  urgency: 'none' | 'watch' | 'act' | 'critical';
  projected_position_loss?: number;
  trigger_lap_estimate?: number;
  gap_delta_trend?: number;
}

export interface DriverStrategy {
  driver: string;
  stints: any[]; // Or StintData
  deg_results: TyreDegResult[];
  undercut_threats: UnderCutThreat[];
  pit_windows: any[];
}

export interface SessionStrategy {
  session_key: string;
  drivers: Record<string, DriverStrategy>;
}

export interface RaceEvent {
  type: 'overtake' | 'pit_stop' | 'safety_car' | 'fastest_lap' | 'incident';
  lap: number;
  driver?: string;
  description: string;
  significance: number;
}

export interface RaceFrame {
  lap: number;
  positions: Record<string, number>;
  gaps: Record<string, number | null>;
  events: RaceEvent[];
  tyre_compounds: Record<string, string>;
  tyre_life: Record<string, number>;
  safety_car: boolean;
}
