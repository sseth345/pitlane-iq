/**
 * PitLane IQ — Constants
 * Team colors, compound colors, and configuration.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// F1 Team colors
export const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'Haas F1 Team': '#B6BABD',
  'RB': '#6692FF',
  'Kick Sauber': '#52E252',
  // Abbreviated fallbacks
  'RBR': '#3671C6',
  'FER': '#E8002D',
  'MER': '#27F4D2',
  'MCL': '#FF8000',
  'AMR': '#229971',
  'ALP': '#FF87BC',
  'WIL': '#64C4FF',
  'HAA': '#B6BABD',
  'ALT': '#6692FF',
  'SAU': '#52E252',
};

// Driver → Team mapping (2024 season, updated as needed)
export const DRIVER_TEAMS: Record<string, string> = {
  'VER': '#3671C6', 'PER': '#3671C6',
  'LEC': '#E8002D', 'SAI': '#E8002D',
  'HAM': '#27F4D2', 'RUS': '#27F4D2',
  'NOR': '#FF8000', 'PIA': '#FF8000',
  'ALO': '#229971', 'STR': '#229971',
  'GAS': '#FF87BC', 'OCO': '#FF87BC',
  'ALB': '#64C4FF', 'SAR': '#64C4FF',
  'MAG': '#B6BABD', 'HUL': '#B6BABD',
  'TSU': '#6692FF', 'RIC': '#6692FF', 'LAW': '#6692FF',
  'BOT': '#52E252', 'ZHO': '#52E252',
  // 2025 additions
  'BEA': '#E8002D', 'ANT': '#FF87BC', 'DOO': '#FF87BC',
  'COL': '#64C4FF', 'HAD': '#6692FF', 'BOR': '#52E252',
};

// Tyre compound colors
export const COMPOUND_COLORS: Record<string, string> = {
  'SOFT': '#E8002D',
  'MEDIUM': '#FFF200',
  'HARD': '#CCCCCC',
  'INTERMEDIATE': '#39B54A',
  'WET': '#0067FF',
  // Short forms
  'S': '#E8002D',
  'M': '#FFF200',
  'H': '#CCCCCC',
  'I': '#39B54A',
  'W': '#0067FF',
};

// Compound display labels
export const COMPOUND_LABELS: Record<string, string> = {
  'SOFT': 'S',
  'MEDIUM': 'M',
  'HARD': 'H',
  'INTERMEDIATE': 'I',
  'WET': 'W',
};

// Session type labels
export const SESSION_LABELS: Record<string, string> = {
  'FP1': 'Practice 1',
  'FP2': 'Practice 2',
  'FP3': 'Practice 3',
  'Q': 'Qualifying',
  'SQ': 'Sprint Qualifying',
  'S': 'Sprint',
  'SS': 'Sprint Shootout',
  'R': 'Race',
};

// Available years
export const YEARS = Array.from({ length: 9 }, (_, i) => 2026 - i);

// Urgency colors
export const URGENCY_COLORS: Record<string, string> = {
  'none': '#52525B',
  'watch': '#F59E0B',
  'act': '#FF8000',
  'critical': '#EF4444',
};
