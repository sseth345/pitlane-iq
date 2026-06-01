import { useSessionStore } from '../../stores/sessionStore';
import { PIT_WALL } from './mockData';
import { TyreDot } from './shared';

export function RightSidebar() {
  const { strategy, selectedDriver, drivers, currentLap } = useSessionStore();
  const driverToShow = selectedDriver || (drivers.length > 0 ? drivers[0].code : null);

  // Extract real strategy payload
  let pitWindows: any[] = [];
  let liftAnalysis: any = null;
  let threatRival = 'N/A';
  let threatGap = 0;

  if (strategy && driverToShow && strategy.drivers[driverToShow]) {
    const s = strategy.drivers[driverToShow];
    pitWindows = s.pit_windows || [];
    
    // Attempt to extract lift stop analysis from the highest threat
    if (s.undercut_threats && s.undercut_threats.length > 0) {
      const topThreat = s.undercut_threats.reduce((prev: any, curr: any) => (prev.score > curr.score ? prev : curr), s.undercut_threats[0]);
      threatRival = topThreat.rival;
      threatGap = topThreat.gap_delta_trend || 0;
      // Synthesize lift stop data for demo based on threat if backend doesn't have it
      liftAnalysis = {
        recomputedGap: topThreat.gap_delta_trend - 2.5, // fake pit loss delta
        onTrackDelta: topThreat.gap_delta_trend,
        aeroLoss: 0.85,
        tyreDelta: 1.75,
        pitLoss: -1.35
      };
    }
  }

  // Fallback options if intelligence engine hasn't processed windows yet
  const displayOptions = pitWindows.length > 0 ? pitWindows.map((pw, i) => ({
    label: `Opt ${i + 1}`,
    laps: [pw.start_lap, pw.end_lap],
    tyres: [pw.compound?.[0] || 'M'],
    result: 'N/A', resultColor: 'var(--txt-primary)',
    delta: '—', deltaColor: 'var(--txt-dim)'
  })) : [
    { label: 'Opt 1', laps: [currentLap + 2, currentLap + 14], tyres: ['M', 'S'] as const, result: '---', resultColor: 'var(--txt-dim)', delta: '—', deltaColor: 'var(--txt-dim)' }
  ];

  return (
    <div style={{ width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      
      {/* Pit Stop Strategy Options */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-mid)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-white)', marginBottom: 12, letterSpacing: '0.04em' }}>
          PIT STRATEGY ({driverToShow || '?'})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 40px 40px 1fr 40px', paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
          {['OPTION', 'LAPS', 'TYRE', 'PREDICTED FINISH', 'DELTA'].map((h, i) => (
            <span key={h} style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt-dim)', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</span>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayOptions.map((opt, i) => (
            <div key={opt.label} style={{ display: 'grid', gridTemplateColumns: '40px 40px 40px 1fr 40px', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: opt.label === 'Opt 1' ? '#00d2be' : 'var(--txt-primary)' }}>{opt.label}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {opt.laps.map((l: number, li: number) => <span key={li} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--txt-secondary)' }}>{l}</span>)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {opt.tyres.map((t: string, ti: number) => <TyreDot key={ti} c={t} sz={14} />)}
              </div>
              <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: opt.resultColor }}>{opt.result}</div>
              <div style={{ textAlign: 'center', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: opt.deltaColor }}>{opt.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Pit Wall Data */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-mid)' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-white)', letterSpacing: '0.04em' }}>LIVE PIT WALL DATA</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e10600', boxShadow: '0 0 6px #e10600' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#e10600', letterSpacing: '0.06em' }}>LIVE</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {/* Waiting for Phase 5 Intelligence Engine for real Pit Wall Feed, using mock for now */}
          {PIT_WALL.map((m, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '6px 0',
              background: m.hi ? 'rgba(255,214,0,0.06)' : 'transparent',
              borderLeft: m.hi ? '2px solid var(--yellow)' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--txt-dim)', flexShrink: 0, paddingLeft: m.hi ? 6 : 0 }}>{m.time}</span>
              <span style={{ fontSize: 11, color: m.hi ? 'var(--yellow)' : 'var(--txt-secondary)' }}>
                {m.msg}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lift Stop Analysis */}
      <div style={{ height: 210, flexShrink: 0, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-white)', letterSpacing: '0.04em', marginBottom: 12 }}>
          LIFT STOP ANALYSIS
        </div>
        {liftAnalysis ? (
          <>
            <div style={{ fontSize: 10, color: 'var(--txt-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Undercut Advantage ({driverToShow} vs {threatRival})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, 50 + (liftAnalysis.recomputedGap * 10)))}%`, height: '100%', background: liftAnalysis.recomputedGap > 0 ? '#00d2be' : '#e8002d', transition: 'width 0.3s ease, background 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: liftAnalysis.recomputedGap > 0 ? '#00d2be' : '#e8002d' }}>
                {liftAnalysis.recomputedGap > 0 ? '+' : ''}{liftAnalysis.recomputedGap.toFixed(2)}s
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Recomputed Gap (Post-Pit):', `${liftAnalysis.recomputedGap > 0 ? '+' : ''}${liftAnalysis.recomputedGap.toFixed(2)}s`, liftAnalysis.recomputedGap > 0 ? '#00d2be' : '#e8002d'],
                ['Δ on Track:', `${liftAnalysis.onTrackDelta > 0 ? '+' : ''}${liftAnalysis.onTrackDelta.toFixed(2)}s`, liftAnalysis.onTrackDelta > 0 ? '#00d2be' : '#e8002d'],
                ['Aero Loss:', `${liftAnalysis.aeroLoss.toFixed(2)}s`, '#6692ff'],
                ['Tyre Delta:', `+${liftAnalysis.tyreDelta.toFixed(2)}s`, '#00d2be'],
                ['Pit Loss:', `${liftAnalysis.pitLoss.toFixed(2)}s`, '#e8002d'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>{k}</span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: c }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 12, color: 'var(--txt-white)' }}>Net Undercut Advantage:</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: liftAnalysis.recomputedGap > 0 ? '#00d2be' : '#e8002d' }}>
                  {liftAnalysis.recomputedGap > 0 ? '+' : ''}{liftAnalysis.recomputedGap.toFixed(2)}s
                </span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-dim)', fontSize: 11 }}>
            No immediate undercut threats detected.
          </div>
        )}
      </div>

    </div>
  );
}
