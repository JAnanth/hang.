import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LightColors, DarkColors } from '../../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../../constants/typography.js';
import { Avatar } from '../../../components/ui/Avatar.js';
import { useAuthStore } from '../../../stores/authStore.js';
import api from '../../../lib/api.js';

export default function OnboardingProfileScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState('');

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: { name: string; username?: string }) => api.patch('/users/me', data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      router.replace('/(auth)/onboarding/groups');
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateUser({ avatarUrl: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Set up your profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your name and photo help friends find you.
        </Text>

        <TouchableOpacity onPress={handlePickImage} style={styles.avatarBtn}>
          <Avatar name={name || 'You'} avatarUrl={user?.avatarUrl} size={80} />
          <Text style={[styles.avatarHint, { color: colors.accent }]}>Tap to add photo</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
            autoFocus
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>USERNAME (OPTIONAL)</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          onPress={() => updateProfile({ name: name.trim(), username: username.trim() || undefined })}
          disabled={name.trim().length === 0 || isPending}
          style={[
            styles.btn,
            { backgroundColor: name.trim() ? colors.textPrimary : colors.border },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.btnText, { color: name.trim() ? colors.background : colors.textTertiary }]}>
              Continue →
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: Spacing['6'], paddingTop: Spacing['8'], gap: Spacing['5'] },
  title: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize['2xl'] },
  subtitle: { fontFamily: FontFamily.sans, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5 },
  avatarBtn: { alignItems: 'center', gap: Spacing['2'] },
  avatarHint: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.sm },
  form: { gap: Spacing['3'] },
  label: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.xs, letterSpacing: 0.8 },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    borderWidth: 1,
  },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginTop: Spacing['4'],
  },
  btnText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.md },
});
