import { useSessionStore } from '../../stores/sessionStore';
import { Activity, Zap, Flag, TrendingUp, AlertTriangle } from 'lucide-react';
import { DriverTable } from '../strategy/DriverTable';

export default function DashboardView() {
  const { currentSession, currentLap, drivers } = useSessionStore();

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  const topDrivers = drivers.slice(0, 3);
  const percentComplete = Math.round((currentLap / currentSession.total_laps) * 100);

  return (
    <div style={{ flex: 1, background: 'var(--bg-base)', padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt-white)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Mission Control
          </h1>
          <p className="t-data" style={{ color: 'var(--txt-secondary)', margin: 0 }}>
            {currentSession.gp_name} - {currentSession.session_type}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="panel" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120 }}>
            <span className="t-label-xs">LAPS COMPLETED</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--cyan)' }}>{percentComplete}%</span>
          </div>
          <div className="panel" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120 }}>
            <span className="t-label-xs">TRACK STATUS</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>CLEAR</span>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, flex: 1 }}>
        
        {/* Left Col: Mini Standings */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={16} color="var(--txt-secondary)" />
            <span className="t-label" style={{ color: 'var(--txt-white)' }}>LIVE STANDINGS</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <DriverTable />
          </div>
        </div>

        {/* Center Col: Quick Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="panel" style={{ flex: 1, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} color="var(--red)" />
              <span className="t-label" style={{ color: 'var(--txt-white)' }}>AI STRATEGY INSIGHTS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-row-alt)', borderRadius: 4, borderLeft: '3px solid var(--cyan)' }}>
                <span className="t-label-xs" style={{ display: 'block', marginBottom: 4 }}>UNDERCUT THREAT</span>
                <span className="t-data" style={{ color: 'var(--txt-primary)' }}>Norris is gaining 0.2s/lap on Verstappen. Undercut likely on Lap 42.</span>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-row-alt)', borderRadius: 4, borderLeft: '3px solid var(--orange)' }}>
                <span className="t-label-xs" style={{ display: 'block', marginBottom: 4 }}>TYRE DEGRADATION</span>
                <span className="t-data" style={{ color: 'var(--txt-primary)' }}>Hamilton's Mediums dropping off 15% faster than expected.</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ flex: 1, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={16} color="var(--yellow)" />
              <span className="t-label" style={{ color: 'var(--txt-white)' }}>RACE CONTROL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span className="t-data" style={{ color: 'var(--txt-dim)' }}>Yellow Flag - Sector 2</span>
                <span className="t-label-xs" style={{ color: 'var(--txt-secondary)' }}>2 MINS AGO</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span className="t-data" style={{ color: 'var(--txt-dim)' }}>DRS Enabled</span>
                <span className="t-label-xs" style={{ color: 'var(--txt-secondary)' }}>LAP 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Top 3 Focus */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Zap size={16} color="var(--cyan)" />
            <span className="t-label" style={{ color: 'var(--txt-white)' }}>PODIUM CONTENDERS</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topDrivers.map((d) => (
              <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-row-alt)', padding: 16, borderRadius: 6, border: '1px solid var(--border-soft)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--txt-white)' }}>
                  {d.pos}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-white)' }}>{d.code}</div>
                  <div className="t-label-xs" style={{ color: 'var(--txt-dim)' }}>GAP: {d.gapToLeader}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
