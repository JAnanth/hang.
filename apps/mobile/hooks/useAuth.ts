import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { queryClient } from '../lib/queryClient.js';
import type { AuthResponse, SendOtpInput, VerifyOtpInput } from '@hang/shared';

export function useSendOtp() {
  return useMutation({
    mutationFn: (data: SendOtpInput) => api.post('/auth/otp/send', data),
  });
}

export function useVerifyOtp() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: VerifyOtpInput & { deviceInfo?: string }) =>
      api.post<{ data: AuthResponse }>('/auth/otp/verify', data).then((r) => r.data.data),

    onSuccess: async (data) => {
      await setAuth(data.user, data.token);
      if (data.isNewUser) {
        router.replace('/(auth)/onboarding/profile');
      } else {
        router.replace('/(tabs)/feed');
      }
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.delete('/auth/session'),
    onSettled: async () => {
      await logout();
      queryClient.clear();
      router.replace('/(auth)');
    },
  });
}
