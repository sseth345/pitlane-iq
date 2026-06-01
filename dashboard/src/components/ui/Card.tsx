/**
 * UI Kit — Card
 */
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  light?: boolean; // The deliberate white-bg contrast panel
  header?: React.ReactNode;
  noPad?: boolean;
}

export function Card({ children, className, glass, light, header, noPad }: CardProps) {
  return (
    <div className={cn(
      light ? 'panel-light' : glass ? 'panel-glass' : 'panel',
      'flex flex-col min-h-0',
      className
    )}>
      {header && (
        <div className={cn(
          'flex items-center justify-between px-3 py-2 flex-shrink-0',
          light ? 'border-b border-black/10' : 'border-b border-[var(--border)]'
        )}>
          {header}
        </div>
      )}
      <div className={cn('flex-1 min-h-0', !noPad && 'p-3')}>
        {children}
      </div>
    </div>
  );
}

interface CardHeaderTextProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardHeaderTextProps) {
  return (
    <span className={cn('label-xs', className)}>
      {children}
    </span>
  );
}
