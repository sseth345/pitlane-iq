import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function TelemetryView() {
  const { currentSession, drivers } = useSessionStore();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(drivers[0]?.code || null);
  const [selectedLap, setSelectedLap] = useState<number>(1);

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  // Mock telemetry data for UI layout
  const mockTelemetry = Array.from({ length: 50 }, (_, i) => ({
    distance: i * 100,
    speed: Math.abs(Math.sin(i / 5)) * 320,
    throttle: Math.abs(Math.sin(i / 5)) * 100,
    brake: Math.abs(Math.cos(i / 5)) * 100,
    gear: Math.floor(Math.abs(Math.sin(i / 5)) * 8) + 1
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'rgba(12,13,18,0.95)', padding: '8px 12px', border: '1px solid var(--border-soft)', borderRadius: 4 }}>
        <div style={{ color: 'var(--txt-dim)', fontSize: 10, marginBottom: 4 }}>DIST {label}m</div>
        <div style={{ color: payload[0].color, fontSize: 12, fontWeight: 700 }}>{Number(payload[0].value).toFixed(0)}</div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', background: 'var(--bg-base)', overflow: 'hidden' }}>
      
      {/* ── SIDEBAR CONTROLS ── */}
      <div style={{ width: 260, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-mid)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border-mid)' }}>
          <h2 style={{ fontSize: 14, color: 'var(--txt-white)', margin: '0 0 16px 0', letterSpacing: '0.04em' }}>TELEMETRY TRACES</h2>
          
          <div style={{ marginBottom: 16 }}>
            <label className="t-label-xs" style={{ display: 'block', marginBottom: 8 }}>PRIMARY DRIVER</label>
            <select 
              value={selectedDriver || ''} 
              onChange={(e) => setSelectedDriver(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--txt-white)', border: '1px solid var(--border-soft)', padding: '8px 12px', borderRadius: 4 }}
            >
              {drivers.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
            </select>
          </div>

          <div>
            <label className="t-label-xs" style={{ display: 'block', marginBottom: 8 }}>LAP</label>
            <input 
              type="number" 
              min={1} 
              max={currentSession.total_laps} 
              value={selectedLap}
              onChange={(e) => setSelectedLap(parseInt(e.target.value))}
              style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--txt-white)', border: '1px solid var(--border-soft)', padding: '8px 12px', borderRadius: 4 }}
            />
          </div>
        </div>
        
        <div style={{ flex: 1, padding: 20 }}>
          <button style={{ width: '100%', padding: '10px 0', background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
            LOAD TRACE DATA
          </button>
        </div>
      </div>

      {/* ── CHARTS AREA ── */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Speed */}
        <div className="panel" style={{ height: 200, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="t-label" style={{ marginBottom: 16, color: 'var(--cyan)' }}>SPEED (km/h)</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTelemetry}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="distance" hide />
                <YAxis domain={[0, 350]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--txt-dim)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="speed" stroke="var(--cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throttle */}
        <div className="panel" style={{ height: 160, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="t-label" style={{ marginBottom: 16, color: 'var(--green)' }}>THROTTLE (%)</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTelemetry}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="distance" hide />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--txt-dim)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="stepAfter" dataKey="throttle" stroke="var(--green)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brake */}
        <div className="panel" style={{ height: 160, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="t-label" style={{ marginBottom: 16, color: 'var(--red)' }}>BRAKE (%)</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTelemetry}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="distance" hide />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--txt-dim)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="stepAfter" dataKey="brake" stroke="var(--red)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gear */}
        <div className="panel" style={{ height: 140, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="t-label" style={{ marginBottom: 16, color: 'var(--orange)' }}>GEAR</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTelemetry}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="distance" hide />
                <YAxis domain={[1, 8]} tickCount={8} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--txt-dim)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="stepAfter" dataKey="gear" stroke="var(--orange)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
