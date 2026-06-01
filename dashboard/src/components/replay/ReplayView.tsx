import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Play, Pause, SkipBack, SkipForward, ShieldAlert } from 'lucide-react';
import { TrackMap } from './TrackMap';
import axios from 'axios';
import { API_BASE } from '../../lib/constants';

export default function ReplayView() {
  const { currentSession } = useSessionStore();
  const [frames, setFrames] = useState<any>({});
  const [totalLaps, setTotalLaps] = useState(0);
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchReplay = async () => {
      if (!currentSession) return;
      try {
        const res = await axios.get(`${API_BASE}/sessions/${currentSession.session_key}/replay`);
        setFrames(res.data.frames || {});
        setTotalLaps(res.data.total_laps || 0);
        setCurrentLap(1);
      } catch (err) {
        console.error("Failed to fetch replay frames", err);
      }
    };
    fetchReplay();
  }, [currentSession]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && currentLap < totalLaps) {
      interval = window.setInterval(() => {
        setCurrentLap(prev => Math.min(prev + 1, totalLaps));
      }, 1000); 
    } else if (currentLap >= totalLaps) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentLap, totalLaps]);

  const frame = frames[currentLap];
  
  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>INITIALIZE TELEMETRY SESSION TO ACCESS REPLAY ENGINE</span>
      </div>
    );
  }

  const sortedDrivers = frame ? Object.entries(frame.positions).sort(([, posA]: any, [, posB]: any) => posA - posB).map(([d]) => d) : [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* ── PLAYBACK HEADER ──────────────────────────────────────────────── */}
      <div style={{ 
        height: 56, display: 'flex', alignItems: 'center', 
        borderBottom: '1px solid var(--border-mid)', background: 'var(--bg-panel)', padding: '0 20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={totalLaps === 0}
            style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--txt-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 4, cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label-xs">Playback Status</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', fontSize: 14 }}>LAP {currentLap} / {totalLaps}</span>
          </div>
        </div>

        <div style={{ flex: 1, margin: '0 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setCurrentLap(Math.max(1, currentLap - 1))} style={{ background: 'none', border: 'none', color: 'var(--txt-secondary)', cursor: 'pointer' }}>
            <SkipBack size={16} />
          </button>
          <input 
            type="range" min={1} max={totalLaps || 1} value={currentLap} 
            onChange={(e) => setCurrentLap(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--cyan)', cursor: 'pointer' }}
          />
          <button onClick={() => setCurrentLap(Math.min(totalLaps, currentLap + 1))} style={{ background: 'none', border: 'none', color: 'var(--txt-secondary)', cursor: 'pointer' }}>
            <SkipForward size={16} />
          </button>
        </div>

        {frame?.safety_car && (
          <div className="pill pill-yellow" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px' }}>
            <ShieldAlert size={14} /> SAFETY CAR
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-mid)' }}>
          {/* Animated Gap Chart Area */}
          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-mid)' }}>
             <h2 className="t-label" style={{ marginBottom: 16 }}>GAP EVOLUTION (SIMULATED)</h2>
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-soft)' }}>
               <span className="t-label-xs">CHART RENDERER ACTIVE — LAP {currentLap}</span>
             </div>
          </div>
          {/* Track Map */}
          <div style={{ height: 280, display: 'flex' }}>
            <TrackMap />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', flexShrink: 0 }}>
          
          {/* Standings Table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-mid)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-soft)' }}>
              <h2 className="t-label">LIVE STANDINGS</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
              {sortedDrivers.map((driver: string, idx: number) => {
                const gap = frame.gaps[driver];
                const compound = frame.tyre_compounds[driver] || 'U';
                return (
                  <div key={driver} style={{
                    display: 'flex', alignItems: 'center', padding: '6px 16px',
                    borderBottom: '1px solid var(--border-ghost)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)'
                  }}>
                    <span className="t-data" style={{ width: 24, color: 'var(--txt-dim)' }}>{idx + 1}</span>
                    <span className="t-data" style={{ width: 40, color: 'var(--txt-white)', fontWeight: 600 }}>{driver}</span>
                    <span className="t-data" style={{ flex: 1, textAlign: 'right', color: 'var(--txt-secondary)' }}>
                      {gap === null ? 'LAPPED' : gap === 0 ? 'LEADER' : `+${gap.toFixed(3)}s`}
                    </span>
                    <div style={{ marginLeft: 16, width: 14, height: 14, borderRadius: '50%', background: compound === 'SOFT' ? 'var(--red)' : compound === 'MEDIUM' ? 'var(--yellow)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#000', fontFamily: 'JetBrains Mono' }}>{compound.charAt(0)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Event Stream */}
          <div style={{ height: 280, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-soft)' }}>
              <h2 className="t-label">EVENT STREAM</h2>
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }} className="no-scrollbar">
              {frame?.events.length === 0 && (
                <span className="t-label-xs" style={{ textAlign: 'center', marginTop: 20 }}>NO EVENTS RECORDED L{currentLap}</span>
              )}
              {frame?.events.map((ev: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <span className="t-data" style={{ color: 'var(--cyan)' }}>L{ev.lap}</span>
                  <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, lineHeight: 1.4 }}>{ev.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
