import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { queryClient } from '../lib/queryClient.js';
import { useAuthStore } from '../stores/authStore.js';
import { registerForPushNotifications, savePushTokenToServer, type NotificationData } from '../lib/notifications.js';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const scheme = useColorScheme();
  const { loadFromStorage, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (!isAuthenticated) {
        router.replace('/(auth)');
      }
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications().then((token) => {
      if (token) savePushTokenToServer(token).catch(() => null);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      if (data.eventId) {
        router.push(`/events/${data.eventId}`);
      }
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="events/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="groups/[id]" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <RootNavigator />
    </QueryClientProvider>
  );
}
