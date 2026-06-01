/**
 * PitLane IQ — App Root
 */

import { useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell';
import StrategyView from './components/strategy/StrategyView';
import DebriefChat from './components/chat/DebriefChat';
import ShadowIntelligence from './components/intelligence/ShadowIntelligence';
import ReplayView from './components/replay/ReplayView';
import DashboardView from './components/dashboard/DashboardView';
import TimingView from './components/timing/TimingView';
import TelemetryView from './components/telemetry/TelemetryView';
import ReportsView from './components/reports/ReportsView';
import DataView from './components/data/DataView';
import SettingsView from './components/settings/SettingsView';
import { useSessionStore } from './stores/sessionStore';

function AppContent() {
  const { activeTab } = useSessionStore();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'strategy':
      return <StrategyView />;
    case 'timing':
      return <TimingView />;
    case 'telemetry':
      return <TelemetryView />;
    case 'replay':
      return <ReplayView />;
    case 'intelligence':
      return <ShadowIntelligence />;
    case 'chat':
      return <DebriefChat />;
    case 'reports':
      return <ReportsView />;
    case 'data':
      return <DataView />;
    case 'settings':
      return <SettingsView />;
    default:
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-secondary)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14 }} className="t-data">
            {String(activeTab).replace('_', ' ')} — Building in Phase 8
          </span>
        </div>
      );
  }
}

export default function App() {
  return (
    <AppShell>
      <AppContent />
    </AppShell>
  );
}
