const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.clickcasal.com.br';
import type { MaintenanceTask, MaintenanceLog } from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  return response;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await api(path, init);
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Manutenção ──────────────────────────────────────────
export async function fetchMaintenanceTasks(): Promise<MaintenanceTask[]> {
  return apiJson<MaintenanceTask[]>('/api/maintenance/tasks');
}

export async function logMaintenanceTask(taskId: string): Promise<MaintenanceLog> {
  return apiJson<MaintenanceLog>(`/api/maintenance/tasks/${taskId}/log`, {
    method: 'POST',
  });
}
