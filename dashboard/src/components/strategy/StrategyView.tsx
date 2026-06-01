/**
 * StrategyView — Modular Layout Container
 */

import { DriverTable } from './DriverTable';
import { GapChart } from './GapChart';
import { TyreDegPanel } from './TyreDegPanel';
import { ThreatGauge } from './ThreatGauge';
import { RightSidebar } from './RightSidebar';

export default function StrategyView() {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── LEFT / CENTER BLOCK ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border-mid)' }}>
        
        {/* TOP ROW: Driver Standings + Gap Chart */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, borderBottom: '1px solid var(--border-mid)' }}>
          <DriverTable />
          <GapChart />
        </div>

        {/* BOTTOM ROW: Tyre Degradation (wide) + Threat Gauge */}
        <div style={{ height: 280, display: 'flex', flexShrink: 0 }}>
          <TyreDegPanel />
          <ThreatGauge />
        </div>
      </div>

      {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
      <RightSidebar />

    </div>
  );
}
