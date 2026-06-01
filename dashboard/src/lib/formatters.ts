/**
 * PitLane IQ — Formatters
 * Display utilities for lap times, gaps, and driver info.
 */

/**
 * Format seconds to lap time string: 1:23.456
 */
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }
  return secs.toFixed(3);
}

/**
 * Format gap: +1.234s or -0.567s
 */
export function formatGap(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  const sign = seconds >= 0 ? '+' : '';
  return `${sign}${seconds.toFixed(3)}s`;
}

/**
 * Format gap to leader: LAP 1 or +1.234
 */
export function formatGapToLeader(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds === 0) return 'LEADER';
  return formatGap(seconds);
}

/**
 * Short compound name
 */
export function compoundShort(compound: string | null | undefined): string {
  if (!compound) return '?';
  const map: Record<string, string> = {
    'SOFT': 'S',
    'MEDIUM': 'M',
    'HARD': 'H',
    'INTERMEDIATE': 'I',
    'WET': 'W',
  };
  return map[compound.toUpperCase()] || compound.charAt(0);
}

/**
 * Format position with ordinal: 1st, 2nd, etc.
 */
export function formatPosition(pos: number | null | undefined): string {
  if (pos == null) return '—';
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = pos % 100;
  return pos + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
