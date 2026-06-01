import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Loader2, PlayCircle, XCircle } from 'lucide-react';

export function SessionSelector() {
  const [year, setYear] = useState<number>(2023);
  const [round, setRound] = useState<number>(1);
  const [sessionType, setSessionType] = useState<string>('R');
  
  const { loadingState, loadingMessage, error, loadSession, cancelLoad, sessionKey } = useSessionStore();

  const handleLoad = () => {
    loadSession(year, round, sessionType);
  };

  const isIdle = loadingState === 'idle' || loadingState === 'error';
  const isReady = loadingState === 'ready';

  const ROUNDS_PER_YEAR: Record<number, number> = {
    2018: 21,
    2019: 21,
    2020: 17,
    2021: 22,
    2022: 22,
    2023: 22,
    2024: 24,
    2025: 24,
    2026: 24
  };

  const CALENDAR_MAP: Record<number, string> = {
    1: 'BHR', 2: 'SAU', 3: 'AUS', 4: 'JPN', 5: 'CHN', 6: 'MIA',
    7: 'EMI', 8: 'MON', 9: 'CAN', 10: 'ESP', 11: 'AUT', 12: 'GBR',
    13: 'HUN', 14: 'BEL', 15: 'NED', 16: 'ITA', 17: 'AZE', 18: 'SIN',
    19: 'USA', 20: 'MXC', 21: 'SAP', 22: 'LVG', 23: 'QAT', 24: 'ABU'
  };

  // Sprint rounds map per year
  const SPRINT_MAP: Record<number, number[]> = {
    2021: [10, 14, 19],
    2022: [4, 11, 21],
    2023: [4, 9, 12, 17, 18, 20],
    2024: [5, 6, 11, 19, 21, 23],
    2025: [6, 7, 14, 20, 22, 23],
    2026: [6, 7, 14, 20, 22, 23],
  };

  const SPRINT_ROUNDS = SPRINT_MAP[year] || [];

  const availableRounds = ROUNDS_PER_YEAR[year] || 24;

  // If the user selects a year with fewer rounds, make sure round selection stays valid
  if (round > availableRounds) {
    setRound(availableRounds);
  }

  const combinedValue = `${round}-${sessionType}`;

  const handleCombinedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [r, type] = e.target.value.split('-');
    setRound(Number(r));
    setSessionType(type);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      
      {/* Inputs */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', padding: '2px', borderRadius: 6 }}>
        <select 
          value={year} 
          onChange={e => setYear(Number(e.target.value))}
          disabled={!isIdle && !isReady}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--txt-white)', padding: '4px 8px',
            fontSize: 12, outline: 'none', cursor: 'pointer'
          }}
        >
          {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
            <option key={y} value={y} style={{ background: '#18181b', color: '#fff' }}>{y}</option>
          ))}
        </select>
        
        <div style={{ width: 1, height: 16, background: 'var(--border-mid)' }} />

        <select 
          value={combinedValue} 
          onChange={handleCombinedChange}
          disabled={!isIdle && !isReady}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--txt-white)', padding: '4px 8px',
            fontSize: 12, outline: 'none', cursor: 'pointer'
          }}
        >
          {Array.from({ length: availableRounds }, (_, i) => i + 1).map(r => {
            const isFuture = year === 2026 && r > 6;
            const gpName = CALENDAR_MAP[r] ? `${r} ${CALENDAR_MAP[r]}` : `Round ${r}`;
            const color = isFuture ? 'var(--txt-dim)' : '#fff';
            
            const options = [];
            
            if (SPRINT_ROUNDS.includes(r)) {
              options.push(
                <option key={`${r}-S`} value={`${r}-S`} style={{ background: '#18181b', color }}>
                  {gpName} - Sprint
                </option>
              );
            }
            
            options.push(
              <option key={`${r}-R`} value={`${r}-R`} style={{ background: '#18181b', color }}>
                {gpName} - Race
              </option>
            );

            return options;
          })}
        </select>
      </div>

      {/* Button & Loader state */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
        {(isIdle || isReady) ? (
          <button 
            onClick={handleLoad}
            style={{
              background: '#00d2be', color: '#000', border: 'none',
              padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.04em'
            }}
          >
            <PlayCircle size={14} /> {isReady ? 'LOAD ANOTHER' : 'LOAD SESSION'}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={14} className="animate-spin" style={{ color: '#00d2be' }} />
            <span style={{ fontSize: 11, color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>
              {loadingMessage}
            </span>
            <button 
              onClick={cancelLoad}
              style={{
                background: 'transparent', border: 'none', padding: 4, 
                cursor: 'pointer', color: 'var(--txt-dim)', marginLeft: 8
              }}
              title="Cancel"
            >
              <XCircle size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Active Session Label */}
      {sessionKey && loadingState === 'ready' && (
        <div style={{ 
          background: 'rgba(0, 210, 190, 0.1)', border: '1px solid rgba(0, 210, 190, 0.3)',
          color: '#00d2be', padding: '4px 8px', borderRadius: 4,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em'
        }}>
          ACTIVE: {sessionKey}
        </div>
      )}

      {/* Error Badge */}
      {error && (
        <div style={{ 
          color: '#e10600', fontSize: 11, fontWeight: 600, 
          maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
