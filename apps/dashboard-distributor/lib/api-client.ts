const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function getStoredHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const headers: Record<string, string> = {};
  const userId = sessionStorage.getItem('x-user-id');
  const userRole = sessionStorage.getItem('x-user-role');

  if (userId) headers['x-user-id'] = userId;
  if (userRole) headers['x-user-role'] = userRole;

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new Error(RATE_LIMIT_EXCEEDED);
  }

  if (!response.ok) {
    let errorData: { message?: string; detail?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    const message =
      errorData.message ||
      errorData.detail ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers: customHeaders, ...restOptions } = options;

  const queryString = params ? buildQueryString(params) : '';
  const url = `${BASE_URL}${endpoint}${queryString}`;

  const storedHeaders = getStoredHeaders();

  const headers: Record<string, string> = Object.assign(
    {},
    { 'Content-Type': 'application/json' },
    storedHeaders,
    customHeaders instanceof Headers
      ? Object.fromEntries(customHeaders.entries())
      : Array.isArray(customHeaders)
        ? Object.fromEntries(customHeaders)
        : customHeaders ?? {}
  );

  const response = await fetch(url, {
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...restOptions,
  });

  return handleResponse<T>(response);
}

// Convenience methods

export async function getData<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiClient<T>(endpoint, { method: 'GET', params });
}

export async function postData<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient<T>(endpoint, { method: 'POST', body });
}

export async function putData<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient<T>(endpoint, { method: 'PUT', body });
}

export async function patchData<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient<T>(endpoint, { method: 'PATCH', body });
}

export async function deleteData<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: 'DELETE' });
}

/**
 * Upload a file (multipart/form-data) to an endpoint.
 * Sets x-user-id / x-user-role from localStorage automatically;
 * does NOT set Content-Type so the browser adds the multipart boundary.
 */
export async function uploadFile<T = unknown>(
  endpoint: string,
  file: File,
  type?: string
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('type', type);

  const headers = getStoredHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse<T>(response);
}

export { RATE_LIMIT_EXCEEDED };
export type { RequestOptions };