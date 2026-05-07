import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { FeedItem, PaginatedResponse } from '@hang/shared';

export function useFeed(groupId?: string | null) {
  return useQuery({
    queryKey: ['feed', groupId ?? 'all'],
    queryFn: async (): Promise<FeedItem[]> => {
      const params = groupId ? { groupId } : {};
      const res = await api.get<PaginatedResponse<FeedItem>>('/events', { params });
      const items = res.data.data;

      if (items.length > 0) {
        items[0] = { ...items[0], isFeatured: true };
      }

      return items;
    },
    staleTime: 20 * 1000,
  });
}
