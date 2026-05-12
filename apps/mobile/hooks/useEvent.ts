import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { EventWithDetails, RsvpStatus, EventComment, CreateEventInput } from '@hang/shared';

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<EventWithDetails> => {
      const res = await api.get<{ data: EventWithDetails }>(`/events/${eventId}`);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useEventRsvps(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId, 'rsvps'],
    queryFn: async () => {
      const res = await api.get<{ data: import('@hang/shared').RsvpEntry[] }>(`/events/${eventId}/rsvps`);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useRsvp(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (status: RsvpStatus) =>
      api.post(`/events/${eventId}/rsvp`, { status }),

    onMutate: async (newStatus) => {
      await qc.cancelQueries({ queryKey: ['event', eventId] });
      const previous = qc.getQueryData<EventWithDetails>(['event', eventId]);

      if (previous) {
        qc.setQueryData<EventWithDetails>(['event', eventId], {
          ...previous,
          currentUserRsvp: newStatus,
          rsvpCounts: {
            ...previous.rsvpCounts,
            [newStatus]: previous.rsvpCounts[newStatus] + 1,
            ...(previous.currentUserRsvp
              ? { [previous.currentUserRsvp]: previous.rsvpCounts[previous.currentUserRsvp] - 1 }
              : {}),
          },
        });
      }

      return { previous };
    },

    onError: (_err, _status, context) => {
      if (context?.previous) {
        qc.setQueryData(['event', eventId], context.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId, 'comments'],
    queryFn: async (): Promise<EventComment[]> => {
      const res = await api.get<{ data: EventComment[] }>(`/events/${eventId}/comments`);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useAddComment(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      api.post<{ data: EventComment }>(`/events/${eventId}/comments`, { body }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId, 'comments'] });
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventInput) =>
      api.post<{ data: EventWithDetails }>('/events', data).then((r) => r.data.data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useEndEvent(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (note?: string) =>
      api.patch(`/events/${eventId}`, { status: 'ended' }).then(async () => {
        if (note?.trim()) {
          await api.post(`/events/${eventId}/comments`, { body: note.trim() });
        }
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useAddTimeOption(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (proposedTime: string) =>
      api.post(`/events/${eventId}/time-options`, { proposedTime }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useVoteOnTime(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (timeOptionId: string) =>
      api.post(`/events/${eventId}/vote`, { timeOptionId }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useConfirmTime(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (timeOptionId: string) =>
      api.post<{ data: EventWithDetails }>(`/events/${eventId}/confirm`, { timeOptionId }).then((r) => r.data.data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
