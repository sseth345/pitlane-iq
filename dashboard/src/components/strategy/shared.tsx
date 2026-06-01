import { PillStatus, TYRE_CFG } from './mockData';

export function TyreDot({ c, sz = 16 }: { c: string; sz?: number }) {
  const cfg = TYRE_CFG[c] || TYRE_CFG.M;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: sz, height: sz, borderRadius: '50%',
      border: `1.5px solid ${cfg.color}`,
      backgroundColor: '#0c0d12',
      color: cfg.text,
      fontSize: sz * 0.65, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0, lineHeight: 1,
    }}>{cfg.label}</span>
  );
}

export function StatusPill({ status }: { status: PillStatus }) {
  if (status === 'none') return <span style={{ color: 'var(--txt-dim)', fontSize: 10 }}>—</span>;
  const cfg: Record<string, { border: string; color: string; label: string }> = {
    pit_open: { border: 'rgba(0,210,190,0.6)', color: '#00d2be', label: 'PIT OPEN' },
    watch:    { border: 'rgba(255,214,0,0.6)',  color: '#ffd600', label: 'WATCH' },
    critical: { border: 'rgba(225,6,0,0.6)',    color: '#e10600', label: 'CRITICAL' },
  };
  const s = cfg[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 2, padding: '1px 6px',
      fontSize: 8, fontWeight: 600, letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}
