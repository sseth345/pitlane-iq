import { useSessionStore } from '../../stores/sessionStore';
import { ChevronRight, Trash2 } from 'lucide-react';

export default function ContextPanel({ targetDriver }: { targetDriver: string }) {
  const { currentSession } = useSessionStore();

  const suggestedPrompts = [
    "Should we undercut Russell?",
    "What if we extend to lap 35?",
    "Compare 1 stop vs 2 stop",
    "Who is the fastest on tyres?",
    "Analyse next pit window"
  ];

  const recentQuestions = [
    { text: "Why did Lewis lose position to Sainz on lap 31?", time: "10:42" },
    { text: "Is a 2 stop faster than 1 stop?", time: "10:40" },
    { text: "Who is at risk of being undercut?", time: "10:38" }
  ];

  if (!currentSession) {
    return (
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', flexShrink: 0, minHeight: 0, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  return (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', flexShrink: 0, minHeight: 0 }}>
      {/* CURRENT CONTEXT */}
      <div style={{ padding: 20, borderBottom: '1px solid var(--border-mid)' }}>
        <h2 className="t-label" style={{ color: 'var(--txt-white)', marginBottom: 16 }}>CURRENT CONTEXT</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img src={`https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png`} alt={targetDriver} style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-panel)' }} />
          <div>
            <h3 className="t-data" style={{ color: 'var(--txt-white)', fontSize: 14 }}>Lewis Hamilton</h3>
            <span className="t-label-xs">MERCEDES</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span className="t-label-xs" style={{ display: 'block', marginBottom: 4 }}>POSITION</span>
            <span className="t-data" style={{ color: 'var(--txt-white)' }}>6th</span>
          </div>
          <div>
            <span className="t-label-xs" style={{ display: 'block', marginBottom: 4 }}>CURRENT TYRE</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', display: 'flex', alignItems: 'center', gap: 4 }}>
              MEDIUM <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--yellow)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>M</span>
            </span>
          </div>
          <div>
            <span className="t-label-xs" style={{ display: 'block', marginBottom: 4 }}>TYRE AGE</span>
            <span className="t-data" style={{ color: 'var(--txt-white)' }}>25 LAPS</span>
          </div>
        </div>
      </div>

      {/* STRATEGY SUMMARY */}
      <div style={{ padding: 20, borderBottom: '1px solid var(--border-mid)' }}>
        <h2 className="t-label" style={{ color: 'var(--txt-white)', marginBottom: 16 }}>STRATEGY SUMMARY</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>Current Strategy</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', fontSize: 12 }}>2 stop</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>Next Planned Stop</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', fontSize: 12 }}>LAP 56-58</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>Best 2 Stop Window</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', fontSize: 12 }}>LAP 55-57</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>Projected Finish</span>
            <span className="t-data" style={{ color: 'var(--txt-white)', fontSize: 12 }}>P5 - P6</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>Strategy Confidence</span>
            <span className="t-data" style={{ color: 'var(--green)', fontSize: 12 }}>78%</span>
          </div>
        </div>
      </div>

      {/* ASK AI SUGGESTIONS */}
      <div style={{ padding: 20, borderBottom: '1px solid var(--border-mid)' }}>
        <h2 className="t-label" style={{ color: 'var(--txt-white)', marginBottom: 16 }}>ASK AI SUGGESTIONS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestedPrompts.map((p, i) => (
            <button key={i} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', padding: '12px 16px', background: 'var(--bg-panel)',
              border: '1px solid var(--border-soft)', borderRadius: 4, cursor: 'pointer',
              color: 'var(--txt-secondary)', fontFamily: 'Inter', fontSize: 12, textAlign: 'left'
            }}>
              {p}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* RECENT QUESTIONS */}
      <div style={{ padding: 20, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <h2 className="t-label" style={{ color: 'var(--txt-white)', marginBottom: 16 }}>RECENT QUESTIONS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {recentQuestions.map((q, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span className="t-data" style={{ color: 'var(--txt-secondary)', fontSize: 11, lineHeight: 1.4 }}>{q.text}</span>
              <span className="t-data" style={{ color: 'var(--txt-dim)', fontSize: 11, flexShrink: 0 }}>{q.time}</span>
            </div>
          ))}
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', 
            border: 'none', color: 'var(--txt-dim)', cursor: 'pointer', marginTop: 8 
          }}>
            <Trash2 size={12} />
            <span className="t-label-xs">Clear History</span>
          </button>
        </div>
      </div>

    </div>
  );
}
