/**
 * ConfidenceBadge — Score display (0–100)
 */

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

export default function ConfidenceBadge({ score, size = 'sm' }: Props) {
  const pct = Math.round(score * (score <= 1 ? 100 : 1));
  const color =
    pct >= 85 ? 'var(--success)' :
    pct >= 60 ? 'var(--warning)' :
    'var(--text-muted)';

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1' : 'text-xs px-1.5';

  return (
    <span
      className={`
        inline-flex items-center font-mono font-medium rounded
        ${sizeClasses}
      `}
      style={{
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {pct}%
    </span>
  );
}
