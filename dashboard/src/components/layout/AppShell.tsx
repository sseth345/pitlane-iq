/**
 * AppShell — Exact pixel match to reference image
 * Structure: Sidebar (left 148px) | Main content | Bottom bar (44px)
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, RotateCcw, Clock, Gauge, Brain,
  BarChart2, Database, Settings,
  ChevronLeft, Bell, Calendar, Cog, Sun, Droplets, Wind,
  PanelLeftClose, LayoutDashboard
} from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { SessionSelector } from './SessionSelector';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       Icon: LayoutDashboard },
  { id: 'strategy',    label: 'Race Strategy',   Icon: Activity },
  { id: 'chat',        label: 'AI Strategist',   Icon: Brain },
  { id: 'intelligence',label: 'Shadow Log',      Icon: Database },
  { id: 'replay',      label: 'Race Replay',     Icon: RotateCcw },
  { id: 'timing',      label: 'Live Timing',     Icon: Clock },
  { id: 'telemetry',   label: 'Telemetry',       Icon: Gauge },
  { id: 'reports',     label: 'Reports',         Icon: BarChart2 },
  { id: 'data',        label: 'Data Explorer',   Icon: Database },
  { id: 'settings',    label: 'Settings',        Icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [localTime, setLocalTime] = useState('15:43:12');
  const { currentSession, activeTab, setActiveTab, currentLap } = useSessionStore();
  
  const handleSetActiveTab = (id: string) => {
    setActiveTab(id as any);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const sidebarW = collapsed ? 60 : 176;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh / 0.75)', width: 'calc(100vw / 0.75)',
      background: 'var(--bg-void)', overflow: 'hidden',
      transform: 'scale(0.75)',
      transformOrigin: 'top left'
    }}>
      {/* ── Row: Sidebar + Content ─────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ══ SIDEBAR ════════════════════════════════════════════════ */}
        <aside style={{
          width: sidebarW,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-mid)',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}>

          {/* Logo */}
          <div style={{
            height: 48, display: 'flex', alignItems: 'center',
            padding: collapsed ? '0 18px' : '0 16px',
            borderBottom: '1px solid var(--border-soft)',
            gap: 8, flexShrink: 0,
          }}>
            {/* Hamburger icon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer', flexShrink: 0 }}
                 onClick={() => setCollapsed(c => !c)}>
              <span style={{ display: 'block', width: 14, height: 1.5, background: 'var(--txt-primary)', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 10, height: 1.5, background: 'var(--txt-primary)', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: 'var(--txt-primary)', borderRadius: 1 }} />
            </div>
            {!collapsed && (
              <span style={{
                fontSize: 14, fontWeight: 700,
                fontFamily: 'Inter', letterSpacing: '0.01em',
                whiteSpace: 'nowrap', color: 'var(--txt-white)',
              }}>
                PitLane <span style={{ color: 'var(--red)' }}>IQ</span>
              </span>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSetActiveTab(id)}
                  title={collapsed ? label : undefined}
                  className="tr"
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: collapsed ? '9px 0' : '9px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    borderLeft: active ? '2px solid var(--red)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={active ? 2 : 1.5}
                    color={active ? 'var(--txt-white)' : 'var(--txt-secondary)'}
                  />
                  {!collapsed && (
                    <span style={{
                      fontSize: 12, fontWeight: active ? 500 : 400,
                      color: active ? 'var(--txt-white)' : 'var(--txt-secondary)',
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Session Info */}
          {!collapsed && (
            <div style={{
              borderTop: '1px solid var(--border-soft)',
              padding: '12px 16px 14px',
              flexShrink: 0,
            }}>
              {/* Session Info wrapped in a box */}
              <div style={{
                border: '1px solid var(--border-soft)',
                borderRadius: 4,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div className="t-label" style={{ marginBottom: 10 }}>Session Info</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    ['Circuit', currentSession?.gp_name || 'Silverstone', true],
                    ['Session', 'Race', false],
                    ['Date', '07 Jul 2024', false],
                    ['Time', '15:00 BST', false],
                    ['Laps', String(currentSession?.total_laps || 52), false],
                    ['Track Temp', '28.4°C', false],
                    ['Air Temp', '20.3°C', false],
                    ['Humidity', '61%', false],
                    ['Wind', '13.2 km/h ↗ SW', false],
                  ].map(([k, v, accent]) => (
                    <div key={String(k)} style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--txt-dim)', width: 68, flexShrink: 0 }}>{k}</span>
                      <span style={{
                        fontSize: 10,
                        color: accent ? 'var(--cyan)' : 'var(--txt-primary)',
                        fontWeight: accent ? 600 : 400,
                      }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIVE badge inside the box */}
              <div style={{
                marginTop: 12,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: 4,
                padding: '3px 8px',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00ff00',
                  boxShadow: '0 0 8px #00ff00',
                  display: 'block',
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#00ff00', letterSpacing: '0.06em' }}>LIVE</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div style={{ padding: '12px 0 14px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--cyan)',
                boxShadow: '0 0 6px var(--cyan)',
              }} />
            </div>
          )}
        </aside>

        {/* ══ MAIN CONTENT AREA ═════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top Header */}
          <header style={{
            height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid var(--border-mid)',
            background: 'var(--bg-base)',
            flexShrink: 0,
          }}>
            {/* Left: Back + Title */}
            {/* Left: Title + Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Collapse Button */}
              <button
                onClick={() => setCollapsed(c => !c)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: 4, color: 'var(--txt-secondary)',
                }}
                title="Toggle Sidebar"
              >
                <PanelLeftClose size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Vertical separator */}
              <div style={{ width: 1, height: 20, background: 'var(--border-mid)' }} />

              <h1 style={{
                margin: 0, fontSize: 13, fontWeight: 600,
                color: 'var(--txt-white)', letterSpacing: '0.02em',
                textTransform: 'uppercase', width: 220,
              }}>
                F1 RACE STRATEGY: {currentSession?.gp_name || 'BRITISH GP'}
              </h1>

              {/* Dynamic Lap Scrubber */}
              {currentSession && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-dim)' }}>
                    LAP {currentLap} / {currentSession.total_laps}
                  </span>
                  <input 
                    type="range" 
                    min="1" 
                    max={currentSession.total_laps} 
                    value={currentLap}
                    onChange={(e) => useSessionStore.getState().setCurrentLap(parseInt(e.target.value))}
                    style={{ width: 150, cursor: 'pointer', accentColor: 'var(--cyan)' }}
                  />
                </div>
              )}
            </div>

            {/* Right: Controls & Session Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              
              <SessionSelector />

              <div style={{ width: 1, height: 20, background: 'var(--border-mid)' }} />

              {/* DRS pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-soft)',
                borderRadius: 4, padding: '4px 10px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.05em' }}>DRS</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt-secondary)', letterSpacing: '0.06em' }}>ENABLED</span>
              </div>

              {/* Icon buttons */}
              {[Calendar, Bell, Cog].map((Icon, i) => (
                <button key={i} style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative',
                }}>
                  <Icon size={16} color="var(--txt-secondary)" />
                  {i === 1 && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--red)',
                      fontSize: 6, color: '#fff', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>3</span>
                  )}
                </button>
              ))}

              {/* Divider */}
              <div style={{ width: 1, height: 22, background: 'var(--border-mid)' }} />

              {/* Driver profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF8000 0%, #E10600 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>SP</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-white)', lineHeight: 1.2 }}>S. Pérez</div>
                  <div style={{ fontSize: 10, color: 'var(--txt-secondary)', lineHeight: 1.2 }}>Driver</div>
                </div>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="var(--txt-dim)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, display: 'flex', minHeight: 0 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* ══ BOTTOM STATUS BAR ══════════════════════════════════════ */}
      <footer style={{
        height: 44,
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-mid)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        gap: 0,
      }}>
        {/* Track Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 24, borderRight: '1px solid var(--border-soft)' }}>
          <span className="t-label" style={{ color: 'var(--txt-dim)', fontSize: 9 }}>TRACK STATUS</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.05em' }}>CLEAR</span>
        </div>

        {/* Weather items */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          {/* Track Temp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sun size={14} color="#FFD600" />
            <div>
              <span className="t-data" style={{ fontSize: 13, color: 'var(--txt-white)' }}>28.4°C</span>
              <span className="t-label-xs" style={{ marginLeft: 5 }}>Track Temp</span>
            </div>
          </div>
          {/* Air Temp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={14} color="var(--cyan)" />
            <div>
              <span className="t-data" style={{ fontSize: 13, color: 'var(--txt-white)' }}>20.3°C</span>
              <span className="t-label-xs" style={{ marginLeft: 5 }}>Air Temp</span>
            </div>
          </div>
          {/* Humidity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={14} color="#5b8dd9" />
            <div>
              <span className="t-data" style={{ fontSize: 13, color: 'var(--txt-white)' }}>61%</span>
              <span className="t-label-xs" style={{ marginLeft: 5 }}>Humidity</span>
            </div>
          </div>
          {/* Wind */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wind size={14} color="var(--txt-secondary)" />
            <div>
              <span className="t-data" style={{ fontSize: 13, color: 'var(--txt-white)' }}>13.2 km/h</span>
              <span style={{ fontSize: 9, color: 'var(--txt-secondary)', marginLeft: 4 }}>↗ SW</span>
              <span className="t-label-xs" style={{ marginLeft: 4 }}>Wind</span>
            </div>
          </div>
        </div>

        {/* Right side status items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, paddingLeft: 24, borderLeft: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-white)', fontFamily: "'JetBrains Mono', monospace" }}>312</span>
            <span className="t-label-xs">km/h</span>
            <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--txt-dim)', textTransform: 'uppercase' }}>Car Speed</span>
          </div>
          <div>
            <span className="t-label-xs" style={{ marginRight: 6 }}>Next Pit Window</span>
            <span className="t-data" style={{ fontSize: 11, color: 'var(--txt-white)' }}>LAP 35-41</span>
          </div>
          <div>
            <span className="t-data" style={{ fontSize: 13, color: 'var(--txt-white)' }}>{localTime}</span>
            <span className="t-label-xs" style={{ marginLeft: 6 }}>Local Time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
