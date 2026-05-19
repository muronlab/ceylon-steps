import { api, ensureCsrfToken } from './client';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  Me,
  RegisterRequest,
  ResetPasswordRequest,
  StartEmailVerificationRequest,
  VerifyEmailOtpRequest,
} from './types';

export async function register(payload: RegisterRequest): Promise<Me> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<Me>('/auth/register', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export async function login(payload: LoginRequest): Promise<Me> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<Me>('/auth/login', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export async function logout(): Promise<{ ok: boolean }> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<{ ok: boolean }>(
    '/auth/logout',
    {},
    {
      headers: { 'x-csrf-token': csrf },
    },
  );
  return res.data;
}

export async function me(): Promise<Me> {
  const res = await api.get<Me>('/auth/me');
  return res.data;
}

export async function startEmailVerification(payload: StartEmailVerificationRequest = {}): Promise<{ ok: true }> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<{ ok: true }>('/auth/email/start-verification', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export async function verifyEmailOtp(payload: VerifyEmailOtpRequest): Promise<Me> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<Me>('/auth/email/verify-otp', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<{ ok: true }> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<{ ok: true }>('/auth/password/forgot', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<{ ok: true }> {
  const csrf = await ensureCsrfToken();
  const res = await api.post<{ ok: true }>('/auth/password/reset', payload, {
    headers: { 'x-csrf-token': csrf },
  });
  return res.data;
}

export function oauthGoogleUrl() {
  return `${api.defaults.baseURL}/auth/oauth/google`;
}
export function oauthFacebookUrl() {
  return `${api.defaults.baseURL}/auth/oauth/facebook`;
}
export function oauthAppleUrl() {
  return `${api.defaults.baseURL}/auth/oauth/apple`;
}

