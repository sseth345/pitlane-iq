import { useSessionStore } from '../../stores/sessionStore';
import { UnderCutThreat } from '../../types/api';

export function ThreatGauge() {
  const { strategy, selectedDriver, drivers } = useSessionStore();
  const driverToShow = selectedDriver || (drivers.length > 0 ? drivers[0].code : null);

  let threat: UnderCutThreat | null = null;
  if (strategy && driverToShow && strategy.drivers[driverToShow]) {
    const s = strategy.drivers[driverToShow];
    if (s.undercut_threats && s.undercut_threats.length > 0) {
      // Pick highest score threat
      threat = s.undercut_threats.reduce((prev: any, curr: any) => (prev.score > curr.score ? prev : curr), s.undercut_threats[0]);
    }
  }

  const score = threat ? threat.score : 0;
  const rival = threat ? threat.rival : 'N/A';
  let label = 'SAFE';
  let labelColor = '#00d2be';
  
  if (score > 75) {
    label = 'CRITICAL';
    labelColor = '#e10600';
  } else if (score > 50) {
    label = 'ACT';
    labelColor = '#ff8000';
  } else if (score > 25) {
    label = 'WATCH';
    labelColor = '#ffd600';
  }

  const cx = 140, cy = 110, r = 85;
  const startAngle = -216, sweepDeg = 252;

  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (from: number, to: number) => {
    const s = toXY(from), e = toXY(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };
  const scoreAngle = startAngle + (score / 100) * sweepDeg;

  return (
    <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-white)', letterSpacing: '0.04em' }}>
        STRATEGY RISK &amp; UNDERCUT THREAT GAUGE
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
            {threat ? `Undercut Threat (${driverToShow} VS ${rival})` : 'No Immediate Threats'}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 280 150" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#00d2be" />
                  <stop offset="50%"  stopColor="#9b59b6" />
                  <stop offset="100%" stopColor="#e10600" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Track bg */}
              <path d={arc(startAngle, startAngle + sweepDeg)} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth={18} strokeLinecap="round" />
              {/* Score arc with glow (only render if score > 0) */}
              {score > 0 && (
                <path d={arc(startAngle, scoreAngle)} fill="none"
                  stroke="url(#gaugeGrad)" strokeWidth={18} strokeLinecap="round" filter="url(#glow)" />
              )}
              {/* Score % */}
              <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff"
                style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {score}%
              </text>
              <text x={cx} y={cy + 20} textAnchor="middle" fill={labelColor}
                style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Inter', letterSpacing: '0.1em' }}>
                {label}
              </text>
            </svg>
          </div>
          {/* Metrics row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 20px', paddingBottom: 16 }}>
            {[
              { label: 'Gap:',      value: threat && threat.gap_delta_trend ? `${threat.gap_delta_trend > 0 ? '+' : ''}${threat.gap_delta_trend.toFixed(2)}s` : '---', color: '#00d2be' },
              { label: 'Pit Exit Δ', value: threat && threat.trigger_lap_estimate ? `LAP ${threat.trigger_lap_estimate}` : '---', color: 'var(--txt-white)' },
              { label: 'Threat:',   value: threat ? threat.urgency.toUpperCase() : 'NONE',   color: labelColor },
            ].map(({ label, value, color }, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--txt-dim)', marginBottom: 4 }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
