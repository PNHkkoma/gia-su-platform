const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { code?: string; message?: string } | null;
};

function normalizeResponse<T>(payload: unknown): ApiResponse<T> {
  if (!payload || typeof payload !== 'object') {
    return { success: true, data: null, error: null };
  }

  const response = payload as Partial<ApiResponse<T>>;
  if ('success' in response) {
    return {
      success: Boolean(response.success),
      data: (response.data ?? null) as T | null,
      error: response.error ?? null,
    };
  }

  return { success: true, data: payload as T, error: null };
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return { success: true, data: null, error: null };
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);
  const normalized = normalizeResponse<T>(payload);

  if (!response.ok || !normalized.success) {
    throw new Error(normalized.error?.message || response.statusText || 'Request failed');
  }

  return normalized;
}
