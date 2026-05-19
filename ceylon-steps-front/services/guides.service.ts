import apiClient from './api-client';

export interface Guide {
  id: string;
  fullName: string;
  displayName: string;
  category: string;
  regions: string[];
  languages: string[];
  mobileNumber: string;
  whatsappAvailable: boolean;
  rating: number;
  reviews: number;
  pricePerDayLkr: number;
  badge?: string;
  badgeType?: string;
}

export const guidesService = {
  async getAll(): Promise<Guide[]> {
    const response = await apiClient.get<Guide[]>('/guides');
    return response.data;
  },

  async getById(id: string): Promise<Guide> {
    const response = await apiClient.get<Guide>(`/guides/${id}`);
    return response.data;
  },
};
