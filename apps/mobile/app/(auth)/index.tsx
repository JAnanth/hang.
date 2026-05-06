import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography.js';
import { useSendOtp } from '../../hooks/useAuth.js';

export default function PhoneEntryScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const { mutate: sendOtp, isPending, error } = useSendOtp();

  const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
  const isValid = /^\+[1-9]\d{8,14}$/.test(formatted);

  const handleSubmit = () => {
    if (!isValid) return;
    sendOtp(
      { phone: formatted },
      {
        onSuccess: () => {
          router.push({ pathname: '/(auth)/verify', params: { phone: formatted } });
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: colors.textPrimary }]}>hang.</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Spontaneous hangouts with your people.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>YOUR PHONE NUMBER</Text>
          <TextInput
            testID="phone-input"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (415) 555-0100"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={[
              styles.input,
              { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border },
            ]}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Something went wrong. Please try again.
            </Text>
          )}

          <TouchableOpacity
            testID="send-otp-btn"
            onPress={handleSubmit}
            disabled={!isValid || isPending}
            style={[
              styles.btn,
              { backgroundColor: isValid ? colors.textPrimary : colors.border },
            ]}
          >
            {isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.btnText, { color: isValid ? colors.background : colors.textTertiary }]}>
                Continue →
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            We'll send a verification code to your phone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing['6'], justifyContent: 'center' },
  header: { marginBottom: Spacing['12'] },
  wordmark: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['3xl'],
    marginBottom: Spacing['2'],
  },
  tagline: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
  },
  form: { gap: Spacing['3'] },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginTop: Spacing['2'],
  },
  btnText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
  },
  disclaimer: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
});
