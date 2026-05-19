import apiClient from './api-client';

export const securityService = {
  async getCsrfToken(): Promise<{ csrfToken: string }> {
    const response = await apiClient.get<{ csrfToken: string }>('/security/csrf');
    return response.data;
  },
};
