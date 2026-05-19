import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await apiClient.get<{ csrfToken: string }>('/security/csrf');
      csrfToken = res.data.csrfToken;
      return csrfToken;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

export function clearCsrfToken() {
  csrfToken = null;
}

type RetryableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean };

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    try {
      const token = await ensureCsrfToken();
      config.headers['x-csrf-token'] = token;
    } catch {
      // best-effort; request will fail naturally if CSRF is required
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryableConfig | undefined;

    // If a state-changing request fails with 403 (likely CSRF token expired),
    // refresh the token and retry once silently.
    if (
      status === 403 &&
      original &&
      !original._csrfRetried &&
      original.method &&
      ['post', 'put', 'delete', 'patch'].includes(original.method.toLowerCase())
    ) {
      original._csrfRetried = true;
      clearCsrfToken();
      try {
        const fresh = await ensureCsrfToken();
        original.headers.set('x-csrf-token', fresh);
        return apiClient.request(original);
      } catch {
        // fall through to reject
      }
    }

    if (status === 403) {
      clearCsrfToken();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
