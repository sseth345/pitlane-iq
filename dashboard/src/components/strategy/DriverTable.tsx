import { TyreDot, StatusPill } from './shared';
import { useSessionStore } from '../../stores/sessionStore';

export function DriverTable() {
  const { drivers, selectedDriver, setSelectedDriver } = useSessionStore();

  return (
    <div style={{
      width: 290, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border-mid)',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 30px 45px 1fr',
        padding: '12px 16px 8px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0,
      }}>
        {['DRIVER', 'TYRES', 'GAP', 'STATUS'].map((h, i) => (
          <span key={h} style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
            color: 'var(--txt-dim)', textAlign: i === 3 ? 'right' : 'left',
          }}>{h}</span>
        ))}
      </div>
      {/* Scrollable List */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
        {drivers.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--txt-dim)', fontSize: 12 }}>
            No session data loaded.
          </div>
        )}
        {drivers.map((d) => {
          const isSelected = selectedDriver === d.code || (!selectedDriver && d.pos === 1);
          return (
            <div 
              key={d.code} 
              onClick={() => setSelectedDriver(d.code)}
              style={{
                display: 'grid', gridTemplateColumns: '18px 2px 28px 30px 45px 1fr',
                padding: '7px 16px', alignItems: 'center', gap: 4,
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'var(--txt-white)' : 'var(--txt-dim)', textAlign: 'right' }}>{d.pos}</span>
              <span style={{ color: 'var(--txt-dim)', fontSize: 10, margin: '0 2px' }}>|</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--txt-white)' : 'var(--txt-dim)' }}>{d.code}</span>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TyreDot c={d.tyreCompound} sz={16} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: d.pos === 1 ? 'var(--txt-dim)' : 'var(--txt-primary)' }}>
                {d.gapToLeader}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <StatusPill status={d.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
