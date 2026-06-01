import { Settings, Key, Database, Zap } from 'lucide-react';

export default function SettingsView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', padding: 32, overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Settings size={28} color="var(--txt-white)" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-white)', margin: 0, letterSpacing: '-0.02em' }}>
          Settings
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 1000 }}>
        
        {/* ── API KEYS ── */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-soft)', paddingBottom: 12 }}>
            <Key size={16} color="var(--cyan)" />
            <h2 className="t-label" style={{ color: 'var(--txt-white)', margin: 0 }}>API CONFIGURATION</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="t-label-xs" style={{ display: 'block', marginBottom: 8, color: 'var(--txt-secondary)' }}>SUPABASE URL</label>
              <input type="text" value={import.meta.env.VITE_SUPABASE_URL || ''} readOnly style={{ width: '100%', background: 'var(--bg-row-alt)', border: '1px solid var(--border-soft)', padding: '10px 12px', borderRadius: 4, color: 'var(--txt-primary)', fontFamily: 'monospace' }} />
            </div>
            <div>
              <label className="t-label-xs" style={{ display: 'block', marginBottom: 8, color: 'var(--txt-secondary)' }}>SUPABASE ANON KEY</label>
              <input type="password" value={import.meta.env.VITE_SUPABASE_ANON_KEY || ''} readOnly style={{ width: '100%', background: 'var(--bg-row-alt)', border: '1px solid var(--border-soft)', padding: '10px 12px', borderRadius: 4, color: 'var(--txt-primary)', fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        {/* ── FASTF1 CACHE ── */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-soft)', paddingBottom: 12 }}>
            <Database size={16} color="var(--orange)" />
            <h2 className="t-label" style={{ color: 'var(--txt-white)', margin: 0 }}>DATA CACHE</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--txt-primary)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              FastF1 relies on a local SQLite cache and massive pandas dataframes. Clear the cache if you encounter stale data.
            </p>
            <button style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', borderRadius: 4, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
              CLEAR FASTF1 CACHE
            </button>
          </div>
        </div>

        {/* ── IBM GRANITE ── */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-soft)', paddingBottom: 12 }}>
            <Zap size={16} color="var(--blue)" />
            <h2 className="t-label" style={{ color: 'var(--txt-white)', margin: 0 }}>IBM GRANITE AI</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="t-label-xs" style={{ display: 'block', marginBottom: 8, color: 'var(--txt-secondary)' }}>LLM PROVIDER</label>
              <select style={{ width: '100%', background: 'var(--bg-row-alt)', border: '1px solid var(--border-soft)', padding: '10px 12px', borderRadius: 4, color: 'var(--txt-primary)' }}>
                <option>IBM watsonx.ai</option>
                <option>OpenRouter</option>
                <option>Groq</option>
              </select>
            </div>
            <div>
              <label className="t-label-xs" style={{ display: 'block', marginBottom: 8, color: 'var(--txt-secondary)' }}>MODEL NAME</label>
              <input type="text" defaultValue="ibm-granite/granite-4.1-8b" style={{ width: '100%', background: 'var(--bg-row-alt)', border: '1px solid var(--border-soft)', padding: '10px 12px', borderRadius: 4, color: 'var(--txt-primary)', fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
