// API Client - Connects to the real backend API with fallback to mock data

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  fromCache: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isBackendAvailable: boolean | null = null;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.checkBackendHealth();
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      this.isBackendAvailable = response.ok;
      console.log(`[Aegis API] Backend ${this.isBackendAvailable ? 'connected' : 'unavailable'} at ${this.baseUrl}`);
      return this.isBackendAvailable;
    } catch {
      this.isBackendAvailable = false;
      console.log(`[Aegis API] Backend unavailable, using demo mode`);
      return false;
    }
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const cacheKey = `GET:${endpoint}`;
    const cached = this.getCached<T>(cacheKey);
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    if (this.isBackendAvailable === null) {
      await this.checkBackendHealth();
    }

    if (!this.isBackendAvailable) {
      return { data: null, error: 'Backend unavailable', fromCache: false };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      return { data, error: null, fromCache: false };
    } catch (error) {
      return { data: null, error: (error as Error).message, fromCache: false };
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    if (this.isBackendAvailable === null) {
      await this.checkBackendHealth();
    }

    if (!this.isBackendAvailable) {
      return { data: null, error: 'Backend unavailable', fromCache: false };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, fromCache: false };
    } catch (error) {
      return { data: null, error: (error as Error).message, fromCache: false };
    }
  }

  // High-level API methods

  async getHealth(): Promise<{ status: string; ai_enabled: boolean } | null> {
    const result = await this.get<{ status: string; ai_enabled: boolean }>('/health');
    return result.data;
  }

  async getAuditEntries(params?: { period?: string; filter?: string; page?: number }): Promise<{
    entries: Array<{
      id: string;
      timestamp: string;
      actor: string;
      action: string;
      resource: string;
      risk_level: string;
      compliance_relevant: number;
    }>;
    pagination: { page: number; total: number; pages: number };
  } | null> {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    if (params?.filter) query.set('filter', params.filter);
    if (params?.page) query.set('page', String(params.page));

    const result = await this.get<any>(`/api/audit?${query}`);
    return result.data;
  }

  async getComplianceStats(): Promise<{
    overview: { total_checks: number; average_score: number; passing_rate: number };
    ai_enabled: boolean;
  } | null> {
    const result = await this.get<any>('/api/compliance/actions/stats');
    return result.data;
  }

  async runComplianceCheck(target: string, targetType: string, frameworks: string[]): Promise<{
    id: string;
    score: number;
    results: Record<string, { score: number; findings: Array<{ id: string; severity: string; message: string }> }>;
  } | null> {
    const result = await this.post<any>('/api/compliance/check', {
      target,
      target_type: targetType,
      frameworks,
    });
    return result.data;
  }

  async getRiskMatrix(): Promise<{
    distribution: Record<string, number>;
    high_risk_items: Array<{ entity_id: string; entity_type: string; risk_level: string }>;
    total_assessed: number;
  } | null> {
    const result = await this.get<any>('/api/risk/actions/matrix');
    return result.data;
  }

  async runRiskAssessment(entityId: string, entityType: string, data?: Record<string, unknown>): Promise<{
    id: string;
    score: number;
    level: string;
    factors: Array<{ name: string; score: number; reason: string }>;
    recommendations: string[];
  } | null> {
    const result = await this.post<any>('/api/risk/assess', {
      entity_id: entityId,
      entity_type: entityType,
      data,
    });
    return result.data;
  }

  async verifyCredential(credential: {
    type: string;
    issuer: string;
    subject: string;
    issued_at: string;
    expires_at?: string;
  }): Promise<{
    id: string;
    status: string;
    checks: Record<string, { passed: boolean; message: string }>;
    eidas_mapping: { assurance_level: string; wallet_compatible: boolean };
  } | null> {
    const result = await this.post<any>('/api/credentials/verify', credential);
    return result.data;
  }

  async scanPII(content: string, context: 'code' | 'document' | 'message' = 'code'): Promise<{
    pii_detected: boolean;
    risk_level: string;
    rule_based: { findings: Array<{ type: string; count: number; risk: string }> };
    recommendations: string[];
  } | null> {
    const result = await this.post<any>('/api/pii/scan', { content, context });
    return result.data;
  }

  async searchRegulations(query: string, limit: number = 5): Promise<{
    results: Array<{
      article: { id: string; framework: string; title: string; summary: string; officialLink: string };
      score: number;
    }>;
  } | null> {
    const result = await this.post<any>('/api/regulations/search', { query, limit });
    return result.data;
  }

  async queryRegulations(question: string): Promise<{
    answer: string;
    sources: Array<{ id: string; framework: string; title: string; link: string }>;
    cached: boolean;
  } | null> {
    const result = await this.post<any>('/api/regulations/query', { question });
    return result.data;
  }

  get isConnected(): boolean {
    return this.isBackendAvailable === true;
  }
}

export const apiClient = new ApiClient();
