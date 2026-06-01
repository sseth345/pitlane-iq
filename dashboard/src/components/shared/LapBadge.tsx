/**
 * LapBadge — Lap number display
 */

interface Props {
  lap: number;
}

export default function LapBadge({ lap }: Props) {
  return (
    <span className="inline-flex items-center px-1 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-base)] border border-[var(--border)] rounded">
      L{lap}
    </span>
  );
}
