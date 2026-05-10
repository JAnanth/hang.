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
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { useSendOtp } from '../../hooks/useAuth';

// Formats raw digit string (up to 10 digits) → "(949) 300-2274"
function formatPhoneDisplay(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function PhoneEntryScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { mutate: sendOtp, isPending, error } = useSendOtp();

  // Store only raw digits; display formatted version
  const [digits, setDigits] = useState('');
  const displayValue = formatPhoneDisplay(digits);
  const e164 = `+1${digits}`;
  const isValid = digits.length === 10;

  const handleChangeText = (text: string) => {
    // Strip everything except digits and cap at 10
    const raw = text.replace(/\D/g, '').slice(0, 10);
    setDigits(raw);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    sendOtp(
      { phone: e164 },
      {
        onSuccess: () => {
          router.push({ pathname: '/(auth)/verify', params: { phone: e164 } });
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

          <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.countryCode, { color: colors.textSecondary }]}>🇺🇸 +1</Text>
            <TextInput
              testID="phone-input"
              value={displayValue}
              onChangeText={handleChangeText}
              placeholder="(949) 000-0000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={[styles.input, { color: colors.textPrimary }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={14} // formatted length: (XXX) XXX-XXXX
            />
          </View>

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing['4'],
  },
  countryCode: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.md,
    marginRight: Spacing['2'],
    paddingVertical: Spacing['4'],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    paddingVertical: Spacing['4'],
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
