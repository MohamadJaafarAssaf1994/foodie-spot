// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { validateLoginForm } from '@/utils/auth-validation';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const handleLogin = async () => {
    const validationError = validateLoginForm({ email, password });
    if (validationError) {
      setLocalError(t(validationError));
      return;
    }

    setLocalError('');
    try {
      await login({ email: email.trim(), password });
    } catch {}
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>{t('auth_login_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_login_subtitle')}</Text>
          </View>

          {displayError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textSubtle} />
              <TextInput style={styles.input} placeholder={t('auth_email')} placeholderTextColor={colors.textSubtle} value={email} onChangeText={value => { setEmail(value); setLocalError(''); }} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.textSubtle} />
              <TextInput style={styles.input} placeholder={t('auth_password')} placeholderTextColor={colors.textSubtle} value={password} onChangeText={value => { setPassword(value); setLocalError(''); }} secureTextEntry={!showPassword} editable={!isLoading} />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth_hide_password') : t('auth_show_password')}
                hitSlop={8}
                style={styles.iconButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} color={colors.textSubtle} /> : <Eye size={20} color={colors.textSubtle} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotButton} accessibilityRole="button">
              <Text style={styles.forgotText}>{t('auth_forgot_password')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth_login')}</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/(auth)/register')} disabled={isLoading}>
            <Text style={styles.registerText}>{t('auth_no_account')} <Text style={styles.registerTextBold}>{t('auth_register_link')}</Text></Text>
          </TouchableOpacity>

          <View style={styles.demoHint}>
            <Text style={styles.demoHintText}>💡 {t('auth_demo_hint')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.tint, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textMuted },
  errorContainer: { backgroundColor: colors.surfaceMuted, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: Radius.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: Spacing.lg, fontSize: 16, color: colors.text },
  forgotButton: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotText: { color: colors.tint, fontSize: 14 },
  button: { backgroundColor: colors.tint, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerButton: { alignItems: 'center', padding: Spacing.lg, marginTop: Spacing.xl },
  registerText: { color: colors.textMuted, fontSize: 14 },
  registerTextBold: { color: colors.tint, fontWeight: '600' },
  demoHint: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: Radius.sm },
  demoHintText: { fontSize: 12, color: colors.warning, textAlign: 'center' },
});
