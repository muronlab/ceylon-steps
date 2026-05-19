import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './config';

let csrfToken: string | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await api.get<{ csrfToken: string }>('/security/csrf');
  csrfToken = res.data.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export type ApiError = {
  status: number;
  message: string;
};

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    return {
      status: ax.response?.status ?? 0,
      message: ax.response?.data?.message ?? ax.message ?? 'Request failed',
    };
  }
  return { status: 0, message: 'Request failed' };
}

