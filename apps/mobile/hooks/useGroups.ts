import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { GroupWithMembership, CreateGroupInput, NotificationLevel } from '@hang/shared';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<GroupWithMembership[]> => {
      const res = await api.get<{ data: GroupWithMembership[] }>('/groups');
      return res.data.data;
    },
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const res = await api.get<{ data: GroupWithMembership & { members: import('@hang/shared').GroupMember[] } }>(`/groups/${groupId}`);
      return res.data.data;
    },
    enabled: !!groupId,
  });
}

export function useOfficialGroupSearch(query: string) {
  return useQuery({
    queryKey: ['groups', 'official', query],
    queryFn: async () => {
      const res = await api.get<{ data: Array<GroupWithMembership & { isMember: boolean }> }>('/groups/official/search', {
        params: { q: query },
      });
      return res.data.data;
    },
    enabled: query.length > 0,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupInput) =>
      api.post<{ data: GroupWithMembership }>('/groups', data).then((r) => r.data.data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, inviteCode }: { groupId: string; inviteCode: string }) =>
      api.post(`/groups/${groupId}/join`, { inviteCode }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => api.post(`/groups/${groupId}/leave`),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUpdateNotificationLevel() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, level }: { groupId: string; level: NotificationLevel }) =>
      api.patch(`/notifications/preferences/${groupId}`, { level }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
