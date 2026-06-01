import { useSessionStore } from '../../stores/sessionStore';
import { TyreDot, StatusPill } from '../strategy/shared';

export default function TimingView() {
  const { currentSession, drivers } = useSessionStore();

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-mid)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt-white)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
          LIVE TIMING
        </h1>
        <p className="t-data" style={{ color: 'var(--txt-secondary)', margin: 0 }}>
          {currentSession.gp_name} - {currentSession.session_type}
        </p>
      </div>

      {/* ── TIMING TABLE ── */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 60px 200px 60px 100px 100px 1fr 100px',
          padding: '12px 24px', borderBottom: '1px solid var(--border-soft)',
          position: 'sticky', top: 0, background: 'var(--bg-sidebar)', zIndex: 10
        }}>
          {['POS', 'NUM', 'DRIVER', 'TYRE', 'GAP', 'INTERVAL', 'STATUS', 'PITS'].map((h, i) => (
            <span key={h} className="t-label" style={{ textAlign: (i === 4 || i === 5 || i === 7) ? 'right' : 'left' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Table Rows */}
        {drivers.map((d, idx) => (
          <div key={d.code} className="tr" style={{
            display: 'grid', gridTemplateColumns: '40px 60px 200px 60px 100px 100px 1fr 100px',
            padding: '10px 24px', borderBottom: '1px solid var(--border-soft)',
            background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)',
            alignItems: 'center'
          }}>
            <span className="t-data" style={{ color: 'var(--txt-white)' }}>{d.pos}</span>
            <span className="t-label-xs" style={{ color: 'var(--txt-dim)' }}>{idx + 1}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-white)' }}>{d.code}</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TyreDot c={d.tyreCompound} sz={16} />
              <span className="t-label-xs" style={{ marginLeft: 6 }}>{d.tyreLife}L</span>
            </div>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: d.pos === 1 ? 'var(--txt-dim)' : 'var(--txt-primary)', textAlign: 'right' }}>
              {d.gapToLeader}
            </span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--txt-secondary)', textAlign: 'right' }}>
              {d.gapToLeader}
            </span>
            <div style={{ display: 'flex' }}>
              <StatusPill status={d.status} />
            </div>
            <span className="t-data" style={{ color: 'var(--txt-dim)', textAlign: 'right' }}>{d.pitStops}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
