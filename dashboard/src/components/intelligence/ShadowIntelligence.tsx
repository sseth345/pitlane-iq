import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Activity, ShieldAlert, Zap, Timer, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ShadowIntelligence() {
  const { currentSession } = useSessionStore();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!currentSession) return;

    // Fetch initial events
    const fetchInitialEvents = async () => {
      const { data, error } = await supabase
        .from('shadow_events')
        .select('*')
        .eq('session_key', currentSession.session_key)
        .order('lap', { ascending: true })
        .order('confidence', { ascending: false });

      if (error) {
        console.error("Failed to fetch shadow events from Supabase", error);
        return;
      }

      if (data) {
        const mapped = data.map((ev: any) => ({
          lap: ev.lap,
          type: ev.category,
          driver: ev.driver,
          description: ev.message,
          significance: ev.confidence
        }));
        setEvents(mapped);
      }
    };

    fetchInitialEvents();

    // Subscribe to new events
    const channel = supabase
      .channel(`shadow_events_${currentSession.session_key}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shadow_events',
          filter: `session_key=eq.${currentSession.session_key}`
        },
        (payload) => {
          const newEvent = {
            lap: payload.new.lap,
            type: payload.new.category,
            driver: payload.new.driver,
            description: payload.new.message,
            significance: payload.new.confidence
          };
          setEvents((prev) => [...prev, newEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'pit_stop': return <Timer size={14} color="var(--blue)" />;
      case 'overtake': return <Zap size={14} color="var(--orange)" />;
      case 'safety_car': return <ShieldAlert size={14} color="var(--red)" />;
      case 'fastest_lap': return <Flag size={14} color="var(--purple)" />;
      default: return <Activity size={14} color="var(--txt-secondary)" />;
    }
  };

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>INITIALIZE TELEMETRY SESSION TO VIEW SHADOW LOG</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', padding: 24, overflow: 'hidden' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Activity size={20} color="var(--cyan)" />
        <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-white)', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0 }}>
          SHADOW INTELLIGENCE LOG
        </h1>
        <div style={{ flex: 1, height: 1, background: 'var(--border-mid)' }} />
        <div className="pill pill-cyan">
          {events.length} EVENTS RECORDED
        </div>
      </div>

      <div style={{ flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border-mid)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'flex', padding: '12px 24px', borderBottom: '1px solid var(--border-mid)', background: 'var(--bg-sidebar)' }}>
          <span className="t-label" style={{ width: 60 }}>LAP</span>
          <span className="t-label" style={{ width: 100 }}>TYPE</span>
          <span className="t-label" style={{ width: 80 }}>DRIVER</span>
          <span className="t-label" style={{ flex: 1 }}>EVENT DESCRIPTION</span>
          <span className="t-label" style={{ width: 80, textAlign: 'right' }}>SIGNIFICANCE</span>
        </div>
        
        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {events.map((ev, idx) => (
            <div 
              key={`${ev.lap}-${idx}`}
              className="tr"
              style={{ 
                display: 'flex', alignItems: 'center', padding: '12px 24px', 
                borderBottom: '1px solid var(--border-soft)',
                background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)'}
            >
              <span className="t-data" style={{ width: 60, color: 'var(--cyan)' }}>{ev.lap}</span>
              <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 8 }}>
                {getEventIcon(ev.type)}
                <span className="t-label-xs" style={{ color: 'var(--txt-primary)' }}>{ev.type.replace('_', ' ')}</span>
              </div>
              <span className="t-data" style={{ width: 80, color: 'var(--txt-white)', fontWeight: 600 }}>{ev.driver || '---'}</span>
              <span className="t-data" style={{ flex: 1, color: 'var(--txt-secondary)', fontSize: 12 }}>{ev.description}</span>
              <span className="t-data" style={{ width: 80, textAlign: 'right', color: 'var(--txt-dim)' }}>{ev.significance.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
