import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Database, Download } from 'lucide-react';

export default function DataView() {
  const { currentSession, laps, strategy } = useSessionStore();
  const [activeTab, setActiveTab] = useState<'laps' | 'strategy'>('laps');

  if (!currentSession) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>LOAD TELEMETRY TO INTERACT</span>
      </div>
    );
  }

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeTab === 'laps' ? laps : strategy, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `pitlane_iq_${activeTab}_${currentSession.session_key}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', padding: 24 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Database size={24} color="var(--cyan)" />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt-white)', margin: 0, letterSpacing: '-0.02em' }}>
            Data Explorer
          </h1>
        </div>
        <button 
          onClick={exportJSON}
          style={{ padding: '8px 16px', background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={16} /> EXPORT JSON
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, borderBottom: '1px solid var(--border-mid)' }}>
        <button 
          onClick={() => setActiveTab('laps')}
          style={{ 
            padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'laps' ? '2px solid var(--cyan)' : '2px solid transparent', 
            color: activeTab === 'laps' ? 'var(--txt-white)' : 'var(--txt-secondary)', fontWeight: 600, cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.05em'
          }}
        >
          LAP RECORDS ({laps?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('strategy')}
          style={{ 
            padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'strategy' ? '2px solid var(--cyan)' : '2px solid transparent', 
            color: activeTab === 'strategy' ? 'var(--txt-white)' : 'var(--txt-secondary)', fontWeight: 600, cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.05em'
          }}
        >
          STRATEGY CACHE
        </button>
      </div>

      <div style={{ flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border-mid)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        <textarea 
          readOnly 
          value={JSON.stringify(activeTab === 'laps' ? laps : strategy, null, 2)}
          style={{ 
            flex: 1, width: '100%', background: 'transparent', color: 'var(--txt-primary)', border: 'none', padding: 20, 
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, resize: 'none', outline: 'none' 
          }}
        />
      </div>

    </div>
  );
}
