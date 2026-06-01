import { useSessionStore } from '../../stores/sessionStore';
import { Target, AlertTriangle, ShieldAlert, Timer } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';

export default function SupportingAnalysis() {
  const { currentSession } = useSessionStore();

  // Mock data for MVP to demonstrate the UI structure from the reference image
  const mockChartData = Array.from({ length: 57 }, (_, i) => ({
    lap: i,
    gap: i < 30 ? (i * -0.1) : (i * 0.1) - 3,
  }));

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-mid)', minHeight: 0, padding: 24, alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1px dashed var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Target size={24} color="var(--border-mid)" />
        </div>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-mid)', minHeight: 0, minWidth: 0 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-mid)', background: 'var(--bg-panel)', overflowX: 'auto' }}>
        {['SUPPORTING ANALYSIS', 'TYRE PERFORMANCE', 'GAP EVOLUTION', 'EVENTS'].map((tab, i) => (
          <button key={tab} style={{
            padding: '16px 20px', background: i === 0 ? 'var(--bg-base)' : 'transparent',
            border: 'none', borderTop: i === 0 ? '2px solid var(--blue)' : '2px solid transparent',
            color: i === 0 ? 'var(--txt-white)' : 'var(--txt-secondary)',
            fontFamily: 'Inter', fontSize: 12, fontWeight: i === 0 ? 600 : 500,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, flex: 1, overflowY: 'auto', minHeight: 0, minWidth: 0 }}>
        {/* GAP EVOLUTION CHART */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 className="t-label" style={{ color: 'var(--txt-white)' }}>GAP TO SAINZ (SAI)</h3>
              <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11 }}>Delta (s) Positive = Behind | Negative = Ahead</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 2, background: 'var(--cyan)' }} />
                <span className="t-label-xs" style={{ color: 'var(--txt-white)' }}>HAM</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 2, background: 'var(--red)' }} />
                <span className="t-label-xs" style={{ color: 'var(--txt-white)' }}>SAI</span>
              </div>
            </div>
          </div>

          <div style={{ height: 250, background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', padding: '20px 20px 0 0', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-mid)" vertical={false} />
                <XAxis dataKey="lap" stroke="var(--txt-secondary)" tick={{ fill: 'var(--txt-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--txt-secondary)" tick={{ fill: 'var(--txt-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}s`} />
                <ReferenceLine x={28} stroke="var(--cyan)" strokeDasharray="3 3" />
                <ReferenceLine x={30} stroke="var(--red)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="gap" stroke="var(--cyan)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KEY FACTORS */}
        <div style={{ marginBottom: 32 }}>
          <h3 className="t-label" style={{ color: 'var(--txt-white)', marginBottom: 16 }}>KEY FACTORS IMPACTING OUTCOME</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', padding: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(147, 51, 234, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Target size={16} color="#A855F7" />
              </div>
              <h4 className="t-label-xs" style={{ color: 'var(--txt-white)' }}>TYRE DEGRADATION</h4>
              <p className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, margin: '8px 0' }}>Mediums (Lap 24-32)<br/>Lewis: -0.32s/lap<br/>Sainz: -0.18s/lap</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span className="t-label-xs">Impact:</span>
                <span className="t-data" style={{ color: 'var(--red)' }}>-1.68s</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', padding: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <ShieldAlert size={16} color="#EAB308" />
              </div>
              <h4 className="t-label-xs" style={{ color: 'var(--txt-white)' }}>UNDERCUT ADVANTAGE</h4>
              <p className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, margin: '8px 0' }}>Sainz pit on lap 30<br/>Net gain: 2.15s<br/>Window: 2 laps</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span className="t-label-xs">Impact:</span>
                <span className="t-data" style={{ color: 'var(--green)' }}>+2.15s</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', padding: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <AlertTriangle size={16} color="#3B82F6" />
              </div>
              <h4 className="t-label-xs" style={{ color: 'var(--txt-white)' }}>DIRTY AIR LOSS</h4>
              <p className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, margin: '8px 0' }}>Tsunoda train (T4-T10)<br/>Time lost: ~0.60s<br/>Laps affected: 4</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span className="t-label-xs">Impact:</span>
                <span className="t-data" style={{ color: 'var(--red)' }}>-0.60s</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-soft)', padding: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Timer size={16} color="#22C55E" />
              </div>
              <h4 className="t-label-xs" style={{ color: 'var(--txt-white)' }}>PIT STOP DELTA</h4>
              <p className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, margin: '8px 0' }}>Lewis pit stop (lap 28)<br/>Stop time: 2.63s<br/>Sainz stop time: 2.18s</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span className="t-label-xs">Impact:</span>
                <span className="t-data" style={{ color: 'var(--red)' }}>-0.45s</span>
              </div>
            </div>

          </div>
        </div>

        {/* AI RECOMMENDATION */}
        <div style={{ background: 'rgba(30,144,255,0.05)', border: '1px solid rgba(30,144,255,0.3)', padding: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 className="t-label" style={{ color: 'var(--blue)', marginBottom: 8 }}>AI RECOMMENDATION (WHAT WE WOULD DO)</h3>
            <p className="t-data" style={{ color: 'var(--txt-primary)', lineHeight: 1.5 }}>
              We would have pitted Lewis on lap 26 for mediums.<br/>
              This would have avoided the Tsunoda train and undercut Sainz, maintaining track position.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(30,144,255,0.3)', paddingLeft: 24, flexShrink: 0 }}>
            <span className="t-label-xs" style={{ marginBottom: 8 }}>CONFIDENCE</span>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="t-data" style={{ fontSize: 20, color: 'var(--txt-white)' }}>78%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
