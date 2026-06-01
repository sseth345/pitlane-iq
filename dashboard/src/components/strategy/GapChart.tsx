import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { StrategyAdapter } from '../../adapters/strategyAdapter';
import { TEAM_COLORS } from '../../lib/constants';

const GapTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(12,13,18,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 4, padding: '7px 10px', fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace", minWidth: 120,
    }}>
      <div style={{ color: 'var(--txt-dim)', marginBottom: 5, fontSize: 9 }}>LAP {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: p.color, marginBottom: 2 }}>
          <span>{p.dataKey}</span>
          <span style={{ color: 'var(--txt-white)' }}>
            {p.value != null ? `${p.value > 0 ? '+' : ''}${Number(p.value).toFixed(2)}s` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

export function GapChart() {
  const [gapMode, setGapMode] = useState<'GAP' | 'INTERVAL'>('INTERVAL');
  const { currentSession, laps, drivers } = useSessionStore();

  // Pick the top 5 drivers + 1 random 'Others' for visualization if possible
  const driversToInclude = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    return drivers.slice(0, 5).map(d => d.code);
  }, [drivers]);

  const chartData = useMemo(() => {
    if (!laps || laps.length === 0) return [];
    return StrategyAdapter.normalizeGapChart(laps, driversToInclude);
  }, [laps, driversToInclude]);

  if (!currentSession || chartData.length === 0) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-dim)' }}>
        Loading Gap Chart...
      </div>
    );
  }

  // Generate colors for drivers
  const getDriverColor = (code: string, index: number) => {
    // In a real app we'd map code -> team -> color
    const colors = ['#00d2be', '#27f4d2', '#ff8000', '#9b59b6', '#e8002d'];
    return colors[index % colors.length];
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '16px 20px 0' }}>
      {/* Title & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-white)', letterSpacing: '0.04em' }}>
            RACE TIMELINE &amp; GAP ANALYSIS
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-dim)', marginTop: 4 }}>
            Delta to Leader (s) / Simulated Pit Undercut Windows
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {driversToInclude.map((code, idx) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: getDriverColor(code, idx), borderRadius: 1 }} />
              <span style={{ fontSize: 10, color: 'var(--txt-secondary)' }}>{code}</span>
            </div>
          ))}
          <button
            onClick={() => setGapMode(m => m === 'GAP' ? 'INTERVAL' : 'GAP')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600, color: 'var(--txt-secondary)', marginLeft: 8,
            }}
          >
            GAP: {gapMode} <ChevronDown size={10} />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={true} horizontal={true} />
              <XAxis
                dataKey="lap" type="number" domain={[0, currentSession.total_laps]} ticks={[0, 10, 20, 30, 40, currentSession.total_laps]}
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--txt-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                label={{ value: 'LAP', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'var(--txt-dim)' } }}
              />
              <YAxis
                domain={[-60, 5]} ticks={[5, 0, -10, -20, -30, -40, -50, -60]}
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--txt-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                tickFormatter={v => `${v > 0 ? '+' : ''}${v}s`}
              />
              <Tooltip content={<GapTooltip />} />

              {/* Data series */}
              {driversToInclude.map((code, idx) => {
                if (idx === 0) {
                  return (
                    <Area key={code} type="monotone" dataKey={code} stroke={getDriverColor(code, idx)} strokeWidth={2.5} fill="transparent" isAnimationActive={false} />
                  );
                }
                return (
                  <Line key={code} type="monotone" dataKey={code} stroke={getDriverColor(code, idx)} strokeWidth={2} dot={false} isAnimationActive={false} />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
