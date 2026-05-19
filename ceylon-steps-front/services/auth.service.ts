import apiClient, { ensureCsrfToken } from './api-client';
import { RegisterResponse } from '../interfaces/auth.interface';
import { RegisterDto } from '../interfaces/dto/register.dto';

export const authService = {
  async register(data: RegisterDto): Promise<RegisterResponse> {
    const csrf = await ensureCsrfToken();
    const response = await apiClient.post<RegisterResponse>('/auth/register', data, {
      headers: { 'x-csrf-token': csrf },
    });
    return response.data;
  },

  async login(data: any): Promise<any> {
    const csrf = await ensureCsrfToken();
    const response = await apiClient.post('/auth/login', data, {
      headers: { 'x-csrf-token': csrf },
    });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      const csrf = await ensureCsrfToken();
      await apiClient.post('/auth/logout', {}, {
        headers: { 'x-csrf-token': csrf },
      });
    } catch {
      // Logout is local-state truthy: if the network call fails, the caller will
      // still clear the user from memory. The session will expire server-side anyway.
    }
  },

  async me(): Promise<any> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async forgotPassword(data: { email: string }): Promise<void> {
    const csrf = await ensureCsrfToken();
    await apiClient.post('/auth/password/forgot', data, {
      headers: { 'x-csrf-token': csrf },
    });
  },

  async resetPassword(data: any): Promise<void> {
    const csrf = await ensureCsrfToken();
    await apiClient.post('/auth/password/reset', data, {
      headers: { 'x-csrf-token': csrf },
    });
  },

  async verifyEmailOtp(data: any): Promise<any> {
    const csrf = await ensureCsrfToken();
    const response = await apiClient.post('/auth/email/verify-otp', data, {
      headers: { 'x-csrf-token': csrf },
    });
    return response.data;
  },

  async startEmailVerification(data: { email?: string }): Promise<void> {
    const csrf = await ensureCsrfToken();
    await apiClient.post('/auth/email/start-verification', data, {
      headers: { 'x-csrf-token': csrf },
    });
  },

  oauthGoogleUrl() {
    return `${apiClient.defaults.baseURL}/auth/oauth/google`;
  },
  oauthFacebookUrl() {
    return `${apiClient.defaults.baseURL}/auth/oauth/facebook`;
  },
  oauthAppleUrl() {
    return `${apiClient.defaults.baseURL}/auth/oauth/apple`;
  },
};
