const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

export type ApiError = {
  code?: string;
  message?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizePayload<T>(payload: unknown): ApiResponse<T> {
  if (!payload || typeof payload !== 'object') {
    return { success: true, data: null, error: null };
  }

  const record = payload as Partial<ApiResponse<T>>;
  if ('success' in record) {
    return {
      success: Boolean(record.success),
      data: (record.data ?? null) as T | null,
      error: record.error ?? null,
    };
  }

  return { success: true, data: payload as T, error: null };
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers,
  });

  if (response.status === 204) {
    return { success: true, data: null, error: null };
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  const normalized = normalizePayload<T>(payload);

  if (!response.ok || !normalized.success) {
    throw new Error(normalized.error?.message || response.statusText || 'Request failed');
  }

  return normalized;
}
