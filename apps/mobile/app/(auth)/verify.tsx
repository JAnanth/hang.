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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { useVerifyOtp, useSendOtp } from '../../hooks/useAuth';

export default function VerifyScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');
  const { mutate: verifyOtp, isPending, error } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useSendOtp();

  const handleVerify = () => {
    if (code.length !== 6) return;
    verifyOtp({ phone: phone ?? '', code });
  };

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) {
      verifyOtp({ phone: phone ?? '', code: cleaned });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Enter code</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit code to {phone}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            testID="otp-input"
            value={code}
            onChangeText={handleCodeChange}
            placeholder="000000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            maxLength={6}
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                borderColor: error ? colors.error : colors.border,
              },
            ]}
            autoFocus
            textContentType="oneTimeCode"
          />

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Invalid or expired code. Please try again.
            </Text>
          )}

          <TouchableOpacity
            testID="verify-btn"
            onPress={handleVerify}
            disabled={code.length !== 6 || isPending}
            style={[
              styles.btn,
              { backgroundColor: code.length === 6 ? colors.textPrimary : colors.border },
            ]}
          >
            {isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.btnText, { color: code.length === 6 ? colors.background : colors.textTertiary }]}>
                Verify →
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => resendOtp({ phone: phone ?? '' })}
            disabled={isResending}
          >
            <Text style={[styles.resendText, { color: colors.accent }]}>
              {isResending ? 'Sending…' : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { paddingHorizontal: Spacing['6'], paddingTop: Spacing['4'] },
  backText: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  container: { flex: 1, paddingHorizontal: Spacing['6'], justifyContent: 'center' },
  header: { marginBottom: Spacing['8'] },
  title: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['2xl'],
    marginBottom: Spacing['2'],
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
  },
  form: { gap: Spacing['3'] },
  codeInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xl,
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1,
  },
  errorText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginTop: Spacing['2'],
  },
  btnText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.md },
  resendText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing['2'],
  },
});
