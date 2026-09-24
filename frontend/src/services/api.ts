import axios from 'axios';
import { Station, Section, MaintenanceRequest, MaintenanceBlock, OptimizationMetrics } from '../types';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    // 1. If HTTPS (e.g. Vercel, SSL reverse proxy, ngrok):
    // Do not call unencrypted http:// to avoid browser Mixed Content blocks
    if (protocol === 'https:') {
      if (envUrl && envUrl.startsWith('https://')) return envUrl;
      return ''; // Relative proxy through Vercel rewrites / host
    }

    // 2. If client is accessing from a remote/LAN IP (e.g. 192.168.x.x, 10.x.x.x)
    // and envUrl is localhost or empty, route requests to that machine's port 8000
    if (
      hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))
    ) {
      return `${protocol}//${hostname}:8000`;
    }

    if (envUrl) {
      return envUrl;
    }

    return `${protocol}//${hostname || 'localhost'}:8000`;
  }
  return envUrl || 'http://localhost:8000';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AuthenticatedUser {
  username: string;
  email: string;
  full_name: string;
  tier_role: 'BOARD_EXEC' | 'ZONAL_HEAD' | 'DIV_CONTROLLER' | 'FIELD_SSE' | 'STATION_MASTER';
  department: string;
  jurisdiction_id: string;
}

const AUTH_TOKEN_KEY = 'railway_access_token';
const AUTH_REFRESH_TOKEN_KEY = 'railway_refresh_token';
const AUTH_USER_KEY = 'railway_user';

apiClient.interceptors.request.use((config) => {
  if (!config.baseURL || config.baseURL === 'http://localhost:8000') {
    config.baseURL = getApiBaseUrl();
  }
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const res = await axios.post<{
            access_token: string;
            refresh_token: string;
            user: AuthenticatedUser;
          }>(`${getApiBaseUrl()}/auth/refresh`, { refresh_token: refreshToken });

          localStorage.setItem(AUTH_TOKEN_KEY, res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, res.data.refresh_token);
          }
          if (res.data.user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Token expired or revoked
          await logout();
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getAuthenticatedUser = (): AuthenticatedUser | null => {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as AuthenticatedUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const login = async (username: string, password: string): Promise<AuthenticatedUser> => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  const cleanUser = username.trim();
  const cleanPass = password.trim();

  const response = await apiClient.post<{
    access_token: string;
    refresh_token?: string;
    user: AuthenticatedUser;
  }>('/auth/login', { username: cleanUser, password: cleanPass });

  localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
  if (response.data.refresh_token) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.refresh_token);
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
  window.dispatchEvent(new Event('railway-auth-changed'));
  return response.data.user;
};

export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      await apiClient.post('/auth/logout', {});
    }
  } catch {
    // Ignore server error during logout cleanup
  } finally {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.dispatchEvent(new Event('railway-auth-changed'));
  }
};

export const getCorridorStations = async (): Promise<Station[]> => {
  const res = await apiClient.get<Station[]>('/api/v1/corridor/stations');
  return res.data;
};

export const getCorridorSections = async (): Promise<Section[]> => {
  const res = await apiClient.get<Section[]>('/api/v1/corridor/sections');
  return res.data;
};

export const getMaintenanceRequests = async (params?: { department?: string; status?: string }): Promise<MaintenanceRequest[]> => {
  const res = await apiClient.get<MaintenanceRequest[]>('/api/v1/maintenance/requests', { params });
  return res.data;
};

export interface MaintenanceRequestPayload {
  department: MaintenanceRequest['department'];
  division_id: string;
  section_id: string;
  from_km: number;
  to_km: number;
  asset_type: string;
  defect_type: string;
  severity: MaintenanceRequest['severity'];
  estimated_duration_minutes: number;
  required_machine_type?: string | null;
}

export const createMaintenanceRequest = async (payload: MaintenanceRequestPayload): Promise<any> => {
  const res = await apiClient.post('/api/v1/maintenance/requests', payload);
  return res.data;
};

export const getBlocks = async (division_id?: string): Promise<MaintenanceBlock[]> => {
  const res = await apiClient.get<MaintenanceBlock[]>('/api/v1/blocks', { params: { division_id } });
  return res.data;
};

export const runOptimization = async (
  division_id = 'DIV_DLI',
  sync = true
): Promise<{ metrics: OptimizationMetrics; blocks: any[] }> => {
  if (sync) {
    const res = await apiClient.post('/api/v1/optimize/run?sync=true', {
      division_id,
      time_horizon_hours: 24,
      max_solver_seconds: 30.0,
      algorithm: 'CPSAT',
    });
    return res.data;
  }
  const initRes = await apiClient.post('/api/v1/optimize/run', {
    division_id,
    time_horizon_hours: 24,
    max_solver_seconds: 30.0,
    algorithm: 'CPSAT',
  });
  const taskId = initRes.data.task_id;
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusRes = await apiClient.get(`/api/v1/optimize/run/${taskId}/status`);
    if (statusRes.data.status === 'COMPLETED' && statusRes.data.result) {
      return statusRes.data.result;
    }
    if (statusRes.data.status === 'FAILED') {
      throw new Error(statusRes.data.detail || 'Optimization failed');
    }
  }
  throw new Error('Optimization polling timed out');
};

export const uploadTG4Telemetry = async (csvContentOrFile: string | File, sectionId?: string): Promise<any> => {
  if (typeof csvContentOrFile === 'string') {
    const res = await apiClient.post('/api/v1/telemetry/upload-tg4', {
      csv_content: csvContentOrFile,
      section_id: sectionId,
    });
    return res.data;
  }
  const formData = new FormData();
  formData.append('file', csvContentOrFile);
  const res = await apiClient.post('/api/v1/telemetry/upload-tg4', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getSectionTelemetryMetrics = async (sectionId: string): Promise<any> => {
  const res = await apiClient.get(`/api/v1/telemetry/sections/${sectionId}/metrics`);
  return res.data;
};

export const getCOAActiveTrains = async (divisionId = 'DIV_DLI'): Promise<any> => {
  const res = await apiClient.get('/api/v1/integrations/coa/active-trains', {
    params: { division_id: divisionId },
  });
  return res.data;
};

export const getCOAOccupancy = async (sectionId: string): Promise<any> => {
  const res = await apiClient.get(`/api/v1/integrations/coa/occupancy/${sectionId}`);
  return res.data;
};

export const sanctionBlock = async (block_id: string): Promise<any> => {
  const res = await apiClient.post(`/api/v1/blocks/${block_id}/sanction`);
  return res.data;
};

export const issueDisconnectionMemo = async (block_id: string, memo_number: string, station_code: string): Promise<any> => {
  const res = await apiClient.post(`/api/v1/blocks/${block_id}/disconnection-memo`, {
    memo_number,
    station_code,
  });
  return res.data;
};

export const issuePTW = async (block_id: string, ptw_number: string, tpc_name: string, subsector: string): Promise<any> => {
  const res = await apiClient.post(`/api/v1/blocks/${block_id}/ptw`, {
    ptw_number,
    tpc_controller_name: tpc_name,
    ohe_isolated_subsector: subsector,
  });
  return res.data;
};

export const issueTrackFit = async (block_id: string, speed_kmh: number, duration_hours: number): Promise<any> => {
  const res = await apiClient.post(`/api/v1/blocks/${block_id}/track-fit`, {
    caution_order_speed_kmh: speed_kmh,
    caution_order_duration_hours: duration_hours,
  });
  return res.data;
};

export const runWhatIfSimulation = async (scenario_type: string, section_id: string, parameter_value: number, target_identifier?: string): Promise<any> => {
  const res = await apiClient.post('/api/v1/simulation/what-if', {
    scenario_type,
    section_id,
    parameter_value,
    target_identifier,
  });
  return res.data;
};

export const getCorridorKPIs = async (): Promise<any> => {
  const res = await apiClient.get('/api/v1/corridor/kpis');
  return res.data;
};

export const getMachineryFleet = async (): Promise<any[]> => {
  const res = await apiClient.get('/api/v1/corridor/machinery');
  return res.data;
};

export const explainMaintenanceRequest = async (requestId: string): Promise<any> => {
  const res = await apiClient.get(`/api/v1/ml/explain/${requestId}`);
  return res.data;
};

export const predictRiskAndExplain = async (data: any): Promise<any> => {
  const res = await apiClient.post('/api/v1/ml/predict-risk', data);
  return res.data;
};

export const getInterDivisionalSync = async (): Promise<any> => {
  const res = await apiClient.get('/api/v1/corridor/inter-divisional-sync');
  return res.data;
};

export const routeMachinery = async (): Promise<any> => {
  const res = await apiClient.post('/api/v1/corridor/route-machinery');
  return res.data;
};

export interface ChatResponse {
  answer: string;
  chart_data?: {
    type: string;
    title: string;
    data: Array<{ name: string; value: number }>;
  };
  suggested_queries: string[];
  data_source: string;
  query_timestamp: string;
  guardrail_latency_ms?: number;
  checks?: Array<{ name: string; status: string; detail: string }>;
  sources?: string[];
  read_only?: boolean;
}

export const sendChatQuery = async (query: string, sessionId?: string): Promise<ChatResponse> => {
  const res = await apiClient.post<ChatResponse>('/api/v1/chat/query', {
    query,
    session_id: sessionId || 'default_session',
    include_suggestions: true,
    include_chart_data: true,
  });
  return res.data;
};

export interface CopilotResponse {
  bot_name: string;
  answer: string;
  as_of_utc: string;
  tools_used: string[];
  checks: { name: string; status: string; detail: string }[];
  sources: string[];
  model: string;
  confidence: string;
  read_only: boolean;
  write_actions_available: string[];
  disclaimer: string;
}

export const askReadOnlyCopilot = async (question: string): Promise<CopilotResponse> => {
  const res = await apiClient.post<CopilotResponse>('/api/v1/copilot/chat', { question });
  return res.data;
};

export interface BenchmarkAlgorithm {
  name: string;
  description: string;
  total_track_hours: number;
  scheduled_requests: number;
  blocks_created: number;
  combined_super_blocks: number;
  total_train_delay_minutes: number;
  passenger_train_delay_minutes: number;
  freight_train_delay_minutes: number;
  impacted_trains_count: number;
  computation_time_seconds: number;
  bundling_efficiency_percent: number;
  asset_availability_gain_percent?: number;
  gsr_compliance: string;
}

export interface OptimizerBenchmarkResponse {
  status: string;
  benchmark_timestamp: string;
  division_id: string;
  sample_size: {
    total_maintenance_requests: number;
    total_active_trains: number;
    time_horizon_hours: number;
    uncoordinated_total_hours: number;
  };
  comparative_summary: {
    asset_availability_gain_percent: number;
    track_possession_hours_saved: number;
    train_delay_reduction_percent: number;
    train_delays_avoided_minutes: number;
    super_block_bundling_efficiency: string;
    overall_benchmark_time_ms: number;
  };
  algorithms: {
    manual_baseline: BenchmarkAlgorithm;
    greedy_heuristic: BenchmarkAlgorithm;
    ai_cpsat_solver: BenchmarkAlgorithm;
  };
  executive_takeaway: string;
}

export const getOptimizerBenchmark = async (divisionId = 'DIV_DLI'): Promise<OptimizerBenchmarkResponse> => {
  const res = await apiClient.get<OptimizerBenchmarkResponse>('/api/v1/optimize/benchmark', {
    params: { division_id: divisionId },
  });
  return res.data;
};

export interface SystemConfigStatus {
  status: string;
  environment: string;
  database: { status: string; url: string };
  redis: { status: string; url: string };
  vault_keys: Record<string, { configured: boolean; masked_value: string; description: string }>;
}

export const getSystemConfigStatus = async (): Promise<SystemConfigStatus> => {
  const res = await apiClient.get<SystemConfigStatus>('/api/v1/system/config-status');
  return res.data;
};

export const getPlatformUsers = async (): Promise<{ source: string; count: number; users: any[] }> => {
  const res = await apiClient.get<{ source: string; count: number; users: any[] }>('/auth/users');
  return res.data;
};
