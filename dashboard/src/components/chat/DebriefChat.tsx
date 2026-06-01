import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { BrainCircuit, Send, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../../lib/constants';
import SupportingAnalysis from './SupportingAnalysis';
import ContextPanel from './ContextPanel';

interface GraniteResponse {
  action: string;
  confidence: number;
  message: string;
  suggested_questions?: string[];
  key_factors?: {
    tyre_degradation?: { impact: number; text: string };
    undercut_advantage?: { impact: number; text: string };
    dirty_air_loss?: { impact: number; text: string };
    pit_stop_delta?: { impact: number; text: string };
  };
}

interface ChatMessage {
  id: number;
  role: 'engineer' | 'granite';
  query?: string;
  result?: GraniteResponse;
  loading?: boolean;
}

export default function DebriefChat() {
  const { currentSession } = useSessionStore();
  const [targetDriver, setTargetDriver] = useState<string>('HAM');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  // Initial auto-query
  useEffect(() => {
    if (!currentSession) return;
    
    const initialQuery = `Analyze telemetry for ${targetDriver}. What is our immediate strategic directive?`;
    
    setChatLog([
      { id: Date.now(), role: 'engineer', query: initialQuery },
      { id: Date.now() + 1, role: 'granite', loading: true }
    ]);
    setIsTyping(true);

    axios.get(`${API_BASE}/sessions/${currentSession.session_key}/debrief/${targetDriver}`)
      .then(res => {
        setChatLog(prev => prev.map(msg => msg.loading ? { ...msg, loading: false, result: res.data } : msg));
      })
      .catch(() => {
        setChatLog(prev => prev.map(msg => msg.loading ? { 
          ...msg, loading: false, 
          result: { action: 'error', confidence: 0, message: 'Communication with IBM Granite failed.' } 
        } : msg));
      })
      .finally(() => setIsTyping(false));
      
  }, [currentSession, targetDriver]);

  const sessionKey = currentSession ? currentSession.session_key : 'general';

  const handleSend = async (queryOverride?: string) => {
    const q = queryOverride || inputValue.trim();
    if (!q || isTyping) return;
    
    setInputValue('');
    setIsTyping(true);

    setChatLog(prev => [
      ...prev,
      { id: Date.now(), role: 'engineer', query: q },
      { id: Date.now() + 1, role: 'granite', loading: true }
    ]);

    try {
      const res = await axios.post(`${API_BASE}/sessions/${sessionKey}/debrief/${targetDriver}`, {
        query: q
      });
      setChatLog(prev => prev.map(msg => msg.loading ? { ...msg, loading: false, result: res.data } : msg));
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Communication with AI Strategist failed.';
      setChatLog(prev => prev.map(msg => msg.loading ? { 
        ...msg, loading: false, 
        result: { action: 'error', confidence: 0, message: errorMsg } 
      } : msg));
    } finally {
      setIsTyping(false);
    }
  };

  const lastGraniteMsg = chatLog.filter(m => m.role === 'granite' && m.result).pop();
  const suggestedPrompts = lastGraniteMsg?.result?.suggested_questions || [
    "Why did Verstappen pit on lap 18?",
    "Is a 2 stop faster than 1 stop?",
    "Who is at risk of being undercut?"
  ];

  const drivers = currentSession?.drivers || ['VER', 'HAM', 'LEC', 'NOR', 'SAI', 'RUS'];

  return (
    <div style={{ flex: 1, display: 'flex', background: 'var(--bg-base)', overflow: 'hidden', minHeight: 0 }}>
      
      {/* COLUMN 1: AI CHAT (LEFT) */}
      <div style={{ flex: '1 1 350px', maxWidth: 450, minWidth: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-mid)' }}>
        
        {/* Header */}
        <div style={{ 
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-mid)', background: 'var(--bg-panel)', padding: '0 20px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrainCircuit size={20} color="var(--blue)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-white)', margin: 0, letterSpacing: '0.02em' }}>
                AI STRATEGIST COPILOT
              </h1>
              <span style={{ fontSize: 10, color: 'var(--blue)', fontFamily: 'Inter', fontWeight: 600, letterSpacing: '0.05em' }}>POWERED BY IBM GRANITE</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="t-label-xs">TARGET</span>
            <select
              value={targetDriver}
              onChange={(e) => setTargetDriver(e.target.value)}
              style={{
                background: 'var(--bg-base)', border: '1px solid var(--border-mid)', color: 'var(--txt-white)',
                padding: '4px 8px', borderRadius: 2, fontFamily: 'JetBrains Mono', fontSize: 12, outline: 'none'
              }}
            >
              {drivers.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
          {chatLog.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msg.role === 'engineer' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-mid)' }}>
                    <span className="t-label-xs" style={{ color: 'var(--txt-secondary)' }}>SP</span>
                  </div>
                  <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-mid)', padding: '12px 16px', borderRadius: '4px 12px 12px 12px' }}>
                    <p className="t-data" style={{ margin: 0, fontSize: 13, color: 'var(--txt-white)' }}>{msg.query}</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BrainCircuit size={16} color="#000" />
                  </div>
                  <div style={{ flex: 1 }}>
                    {msg.loading ? (
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                         <Loader2 className="animate-spin" size={16} color="var(--blue)" />
                         <span className="t-data" style={{ color: 'var(--txt-secondary)' }}>Granite is reasoning...</span>
                       </div>
                    ) : (
                      <>
                        <p className="t-data" style={{ margin: 0, fontSize: 13, color: 'var(--txt-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {msg.result?.message}
                        </p>
                        <button style={{ 
                          marginTop: 12, padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-mid)',
                          color: 'var(--txt-white)', borderRadius: 4, fontFamily: 'Inter', fontSize: 11, cursor: 'pointer'
                        }}>
                          View supporting data
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ padding: 20, borderTop: '1px solid var(--border-mid)', background: 'var(--bg-panel)' }}>
          {/* Suggested Prompts Chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                style={{ 
                  background: 'var(--bg-base)', border: '1px solid var(--border-soft)', padding: '6px 12px', 
                  borderRadius: 16, color: 'var(--txt-secondary)', fontFamily: 'Inter', fontSize: 11, whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', border: '1px solid var(--border-soft)', background: 'var(--bg-base)', borderRadius: 2 }}>
            <input 
              type="text" 
              placeholder="Ask me anything about strategy, tyres, gaps, or race events..." 
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 16px', color: 'var(--txt-white)', fontFamily: 'Inter', fontSize: 13, outline: 'none' }}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isTyping || !inputValue.trim()}
              style={{ background: isTyping || !inputValue.trim() ? 'var(--bg-panel)' : 'var(--cyan)', border: 'none', padding: '0 20px', color: '#000', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* COLUMN 2: SUPPORTING ANALYSIS (CENTER) */}
      <SupportingAnalysis />

      {/* COLUMN 3: CONTEXT PANEL (RIGHT) */}
      <ContextPanel targetDriver={targetDriver} />

    </div>
  );
}
