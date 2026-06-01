import { useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { StrategyAdapter } from '../../adapters/strategyAdapter';
import { TYRE_CFG } from './mockData';

const TyreTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(248,248,248,0.97)', border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: 3, padding: '5px 8px',
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#333',
    }}>
      <div style={{ color: '#888', marginBottom: 3, fontSize: 9 }}>LAP {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 1 }}>
          {p.dataKey}: {Number(p.value).toFixed(1)}% wear
        </div>
      ))}
    </div>
  );
};

export function TyreDegPanel() {
  const { laps, drivers, selectedDriver, currentSession } = useSessionStore();

  const driverToShow = useMemo(() => {
    if (selectedDriver) return selectedDriver;
    if (drivers && drivers.length > 0) return drivers[0].code;
    return null;
  }, [selectedDriver, drivers]);

  const { chartData, stintsInfo, activeCompounds } = useMemo(() => {
    if (!laps || !driverToShow) return { chartData: [], stintsInfo: [], activeCompounds: [] };
    const res = StrategyAdapter.normalizeTyreDegChart(laps, driverToShow);
    
    // Extract unique compounds that are present in the chart data
    const compounds = new Set<string>();
    res.chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'lap') compounds.add(k);
      });
    });

    return { ...res, activeCompounds: Array.from(compounds) };
  }, [laps, driverToShow]);

  if (!currentSession || !driverToShow || chartData.length === 0) {
    return (
      <div style={{ flex: 1.4, background: '#fcfcfc', borderRight: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Loading Tyre Degradation Data...
      </div>
    );
  }

  const getCompoundColor = (compName: string) => {
    if (compName.includes('SOFT')) return '#e8002d';
    if (compName.includes('MEDIUM')) return '#ffd600';
    if (compName.includes('HARD')) return '#444444';
    if (compName.includes('INTER')) return '#39b54a';
    if (compName.includes('WET')) return '#0067ff';
    return '#9b59b6';
  };

  return (
    <div style={{
      flex: 1.4,
      background: '#fcfcfc',
      borderRight: '1px solid var(--border-mid)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>TYRE WEAR &amp; LIFESPAN</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{driverToShow} Stint History</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none',
          fontSize: 10, color: '#444', cursor: 'pointer',
        }}>
          Live telemetry &amp; lifespan <ChevronDown size={10} />
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: -20, bottom: 10 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="lap" type="number" domain={[0, currentSession.total_laps]} ticks={[0, 10, 20, 30, 40, currentSession.total_laps]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888' }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888' }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<TyreTooltip />} />
              
              <defs>
                {activeCompounds.map(comp => (
                  <linearGradient key={comp} id={`grad-${comp}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getCompoundColor(comp)} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={getCompoundColor(comp)} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>

              {activeCompounds.map(comp => (
                <Area 
                  key={comp} 
                  type="monotone" 
                  dataKey={comp} 
                  stroke={getCompoundColor(comp)} 
                  strokeWidth={2.5} 
                  fill={`url(#grad-${comp})`} 
                  isAnimationActive={false} 
                  activeDot={{ r: 4 }} 
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Dynamic Stint Summary Box */}
        {stintsInfo.length > 0 && (
          <div style={{ position: 'absolute', right: 4, top: 4, textAlign: 'right', background: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 4 }}>
             <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Current Stint</div>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
               <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{stintsInfo[stintsInfo.length - 1].laps} Laps</span>
               <span style={{ background: getCompoundColor(stintsInfo[stintsInfo.length - 1].compound), color: '#fff', padding: '2px 4px', borderRadius: 2, fontSize: 9, fontWeight: 700 }}>
                 {stintsInfo[stintsInfo.length - 1].compound.split(' ')[0]}
               </span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
