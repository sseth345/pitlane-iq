/**
 * DriverChip — Driver abbreviation + team color badge
 */

import { DRIVER_TEAMS } from '../../lib/constants';

interface Props {
  driver: string;
  size?: 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
}

export default function DriverChip({ driver, size = 'sm', selected, onClick }: Props) {
  const color = DRIVER_TEAMS[driver] || '#6B7280';
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <button
      id={`driver-chip-${driver}`}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 font-mono font-medium rounded
        border transition-colors duration-150 cursor-pointer
        ${sizeClasses}
        ${selected
          ? 'bg-[var(--bg-elevated)] border-current'
          : 'bg-transparent border-[var(--border)] hover:bg-[var(--bg-elevated)]'
        }
      `}
      style={{ color, borderColor: selected ? color : undefined }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {driver}
    </button>
  );
}
