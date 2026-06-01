/**
 * CompoundBadge — Tyre compound indicator (S/M/H/I/W)
 */

import { COMPOUND_COLORS, COMPOUND_LABELS } from '../../lib/constants';

interface Props {
  compound: string | null | undefined;
  size?: 'sm' | 'md';
}

export default function CompoundBadge({ compound, size = 'sm' }: Props) {
  if (!compound) return <span className="text-[var(--text-muted)]">?</span>;

  const upper = compound.toUpperCase();
  const color = COMPOUND_COLORS[upper] || '#6B7280';
  const label = COMPOUND_LABELS[upper] || upper.charAt(0);
  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs';

  return (
    <span
      id={`compound-badge-${upper}`}
      className={`
        inline-flex items-center justify-center font-mono font-bold
        rounded-sm ${sizeClasses}
      `}
      style={{
        backgroundColor: color,
        color: upper === 'MEDIUM' || upper === 'M' ? '#000' : '#fff',
      }}
      title={compound}
    >
      {label}
    </span>
  );
}
