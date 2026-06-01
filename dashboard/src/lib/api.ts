/**
 * PitLane IQ — API Client
 * Enterprise V2: Includes AbortController support for all long-running FastF1 fetches.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  SessionListItem, SessionInfo, LapData, 
  SessionStrategy, RaceFrame 
} from '../types/api';
import { API_BASE } from './constants';

class PitLaneAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Helper to execute requests with cancellation support.
   */
  private async get<T>(url: string, signal?: AbortSignal, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, { ...config, signal });
    return response.data;
  }

  private async post<T>(url: string, data: any, signal?: AbortSignal, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, { ...config, signal });
    return response.data;
  }

  // ── Sessions ────────────────────────────────────────────────────────

  async listSessions(signal?: AbortSignal): Promise<SessionListItem[]> {
    return this.get<SessionListItem[]>('/sessions', signal);
  }

  async loadSession(year: number, round: number, sessionType: string, signal?: AbortSignal): Promise<{status: string, session_key: string, message?: string}> {
    return this.post<{status: string, session_key: string, message?: string}>('/sessions/load', {
      year,
      round,
      session_type: sessionType
    }, signal);
  }

  async checkLoadStatus(key: string, signal?: AbortSignal): Promise<{status: string, message?: string}> {
    return this.get<{status: string, message?: string}>(`/sessions/load/status/${key}`, signal);
  }

  async getSessionInfo(key: string, signal?: AbortSignal): Promise<SessionInfo> {
    return this.get<SessionInfo>(`/sessions/${key}`, signal);
  }

  async getLaps(key: string, signal?: AbortSignal): Promise<LapData[]> {
    const res = await this.get<{laps: LapData[]}>(`/sessions/${key}/laps`, signal);
    return res.laps;
  }

  // ── Intelligence & Strategy ─────────────────────────────────────────

  async getStrategy(key: string, signal?: AbortSignal): Promise<SessionStrategy> {
    return this.get<SessionStrategy>(`/sessions/${key}/strategy`, signal);
  }

  async getReplayFrames(key: string, signal?: AbortSignal): Promise<Record<string, RaceFrame>> {
    return this.get<Record<string, RaceFrame>>(`/sessions/${key}/replay`, signal);
  }
}

export const api = new PitLaneAPI();
