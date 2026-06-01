/**
 * UI Kit — ThreatGauge
 * Animated SVG semicircular gauge for undercut threat (0–100)
 * Gradient arc: cyan → purple → red as threat increases
 */

import { motion } from 'framer-motion';

interface Props {
  score: number;       // 0–100
  urgency: 'none' | 'watch' | 'act' | 'critical';
  driver?: string;
  rival?: string;
  gapDelta?: number;
  pitExitDelta?: number;
}

const URGENCY_LABEL: Record<string, string> = {
  none:     'SAFE',
  watch:    'WATCH',
  act:      'ACT NOW',
  critical: 'CRITICAL',
};

const URGENCY_COLOR: Record<string, string> = {
  none:     '#10B981',
  watch:    '#F59E0B',
  act:      '#FF8700',
  critical: '#E10600',
};

export default function ThreatGauge({ score, urgency, driver, rival, gapDelta, pitExitDelta }: Props) {
  // SVG arc geometry — 220° sweep semicircle
  const cx = 80, cy = 78, r = 60;
  const startAngle = -220;
  const sweepDeg   = 220;
  const scoreAngle = startAngle + (score / 100) * sweepDeg;

  function polarToCart(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToCart(startDeg);
    const e = polarToCart(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const trackPath  = describeArc(startAngle, startAngle + sweepDeg);
  const scorePath  = score > 0 ? describeArc(startAngle, scoreAngle) : '';
  const scoreColor = URGENCY_COLOR[urgency];
  const isCritical = urgency === 'critical';

  return (
    <div className="flex flex-col h-full">
      {/* Label bar */}
      {(driver || rival) && (
        <div className="label-xs text-center mb-1" style={{ fontSize: 8 }}>
          UNDERCUT THREAT {driver && rival ? `(${driver} vs ${rival})` : ''}
        </div>
      )}

      {/* SVG Gauge */}
      <div className="flex justify-center">
        <svg width="160" height="100" viewBox="0 0 160 100" style={{ overflow: 'visible' }}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#00D2BE" />
              <stop offset="50%"  stopColor="#A855F7" />
              <stop offset="100%" stopColor="#E10600" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path d={trackPath} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />

          {/* Score arc */}
          {scorePath && (
            <motion.path
              d={scorePath}
              fill="none"
              stroke={isCritical ? 'url(#gaugeGrad)' : scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}

          {/* Score number */}
          <motion.text
            x={cx} y={cy - 6} textAnchor="middle"
            fill={isCritical ? '#E10600' : '#FAFAFA'}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 24, fontWeight: 700,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {Math.round(score)}%
          </motion.text>

          {/* Urgency label */}
          <motion.text
            x={cx} y={cy + 12} textAnchor="middle"
            fill={scoreColor}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}
            className={isCritical ? 'animate-pulse-red' : ''}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {URGENCY_LABEL[urgency]}
          </motion.text>
        </svg>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        <MetricCell label="Gap" value={gapDelta !== undefined ? `${gapDelta > 0 ? '+' : ''}${gapDelta.toFixed(2)}s` : '—'} color={gapDelta !== undefined && gapDelta < 0 ? '#E10600' : '#FAFAFA'} />
        <MetricCell label="Pit Exit Δ" value={pitExitDelta !== undefined ? `${pitExitDelta.toFixed(1)}s` : '—'} />
        <MetricCell label="Threat" value={URGENCY_LABEL[urgency]} color={scoreColor} />
      </div>
    </div>
  );
}

function MetricCell({ label, value, color = '#FAFAFA' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 3, padding: '4px 2px'
    }}>
      <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color }}>
        {value}
      </span>
    </div>
  );
}
