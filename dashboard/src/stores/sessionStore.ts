import { create } from 'zustand';
import { api } from '../lib/api';
import { StrategyAdapter, NormalizedDriver } from '../adapters/strategyAdapter';

import { SessionInfo } from '../types/api';

export type LoadingState = 'idle' | 'fetching' | 'processing' | 'hydrating' | 'ready' | 'error';

interface SessionState {
  // UI State
  activeTab: 'strategy' | 'dashboard' | 'replay' | 'timing' | 'telemetry' | 'intelligence' | 'reports' | 'data' | 'settings' | 'chat';
  setActiveTab: (tab: any) => void;

  // Global Data State
  sessionKey: string | null;
  currentSession: SessionInfo | null;
  currentLap: number;
  drivers: NormalizedDriver[];
  laps: any[];
  strategy: any | null;
  selectedDriver: string | null;
  setSelectedDriver: (driver: string) => void;

  // Loading State
  loadingState: LoadingState;
  loadingMessage: string;
  error: string | null;
  
  // Abort Controller for cancelling fastf1 fetches
  currentAbortController: AbortController | null;

  // Actions
  setLoadingState: (state: LoadingState, message?: string) => void;
  setError: (error: string) => void;
  setCurrentLap: (lap: number) => void;
  
  // The "Magic Moment" orchestrator
  loadSession: (year: number, round: number, sessionType: string) => Promise<void>;
  cancelLoad: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeTab: 'strategy',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sessionKey: null,
  currentSession: null,
  currentLap: 1,
  drivers: [],
  laps: [],
  strategy: null,
  selectedDriver: null,
  setSelectedDriver: (driver) => set({ selectedDriver: driver }),
  setCurrentLap: (lap) => set((state) => {
    if (!state.currentSession) return {};
    const clampedLap = Math.max(1, Math.min(lap, state.currentSession.total_laps));
    const normalizedDrivers = StrategyAdapter.normalizeDriverTable(state.laps, state.strategy, clampedLap);
    return { currentLap: clampedLap, drivers: normalizedDrivers };
  }),

  loadingState: 'idle',
  loadingMessage: '',
  error: null,
  currentAbortController: null,

  setLoadingState: (state, message = '') => set({ loadingState: state, loadingMessage: message }),
  setError: (error) => set({ loadingState: 'error', error, loadingMessage: '' }),

  cancelLoad: () => {
    const { currentAbortController } = get();
    if (currentAbortController) {
      currentAbortController.abort();
      set({ 
        currentAbortController: null, 
        loadingState: 'idle', 
        loadingMessage: 'Session load cancelled.',
        sessionKey: null,
        currentSession: null,
        drivers: []
      });
    }
  },

  loadSession: async (year: number, round: number, sessionType: string) => {
    const store = get();
    
    // Cancel any existing load
    if (store.currentAbortController) {
      store.currentAbortController.abort();
    }

    const abortController = new AbortController();
    set({ 
      currentAbortController: abortController,
      error: null,
      sessionKey: null,
      currentSession: null,
      drivers: [],
      loadingState: 'fetching',
      loadingMessage: `Checking cache for ${year} Round ${round}...`
    });

    try {
      // 1. Fetching (Trigger backend to load via FastF1, might take 30s if not cached)
      // The backend returns { status: "cached" | "downloaded", session_key: "..." }
      const loadRes = await api.loadSession(year, round, sessionType, abortController.signal);
      
      // If it was already cached, the backend returns the session object. 
      // If it's loading, it returns session_key at the top level.
      const sessionKey = loadRes.session_key || (loadRes as any).session?.session_key;
      set({ sessionKey });

      if (loadRes.status === 'ready') {
        set({
          loadingState: 'processing',
          loadingMessage: 'Loaded from cache. Hydrating...'
        });
      } else {
        set({
          loadingState: 'processing',
          loadingMessage: loadRes.message || 'Downloading telemetry from FastF1...'
        });

        // Polling loop
        let isReady = false;
        while (!isReady) {
          if (abortController.signal.aborted) throw new Error('Aborted');
          await new Promise(r => setTimeout(r, 1000));
          const statusRes = await api.checkLoadStatus(sessionKey, abortController.signal);
          
          if (statusRes.status === 'error') {
            throw new Error(statusRes.message || 'Failed to load session on backend');
          } else if (statusRes.status === 'ready') {
            isReady = true;
          } else {
            set({ loadingMessage: statusRes.message || 'Processing data...' });
          }
        }
      }

      // 2. Hydrating (Fetching the actual JSON payloads)
      set({
        loadingState: 'hydrating',
        loadingMessage: 'Fetching telemetry...'
      });

      const [sessionInfo, laps, strategy] = await Promise.all([
        api.getSessionInfo(sessionKey, abortController.signal),
        api.getLaps(sessionKey, abortController.signal),
        api.getStrategy(sessionKey, abortController.signal)
      ]);

      set({
        loadingMessage: 'Hydrating components...'
      });

      // Normalize using Adapter
      const currentLap = sessionInfo.total_laps > 0 ? Math.min(34, sessionInfo.total_laps) : 1; // Fake lap 34 for static view, or use latest
      const normalizedDrivers = StrategyAdapter.normalizeDriverTable(laps, strategy, currentLap);

      set({
        currentSession: sessionInfo,
        currentLap: currentLap,
        drivers: normalizedDrivers,
        laps: laps,
        strategy: strategy
      });

      // 3. Ready
      set({
        loadingState: 'ready',
        loadingMessage: 'Session ready.',
        currentAbortController: null
      });

    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log('Session load aborted.');
      } else {
        console.error('Failed to load session', err);
        set({ 
          loadingState: 'error', 
          error: err.response?.data?.detail || err.message || 'Unknown error occurred.',
          currentAbortController: null
        });
      }
    }
  }
}));
