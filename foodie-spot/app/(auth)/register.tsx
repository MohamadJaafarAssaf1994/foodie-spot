
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { RegisterFieldErrors, validateRegisterFields, validateRegisterForm } from '@/utils/auth-validation';

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    setFieldErrors(current => ({ ...current, [field]: undefined }));
    setLocalError('');
  };

  const handleRegister = async () => {
    const values = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    };
    const nextFieldErrors = validateRegisterFields(values);
    setFieldErrors(nextFieldErrors);

    const validationError = validateRegisterForm(values);
    if (validationError) {
      setLocalError(t(validationError));
      return;
    }

    setLocalError('');
    setFieldErrors({});
    try {
      await register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
    } catch {}
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>{t('auth_register_title')}</Text>
          </View>

          {displayError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.fieldWrapper}>
                <View style={[styles.inputContainer, styles.nameField, fieldErrors.firstName && styles.inputContainerError]}>
                <User size={20} color={colors.textSubtle} />
                <TextInput style={styles.input} placeholder={t('auth_first_name')} value={firstName} onChangeText={value => { setFirstName(value); clearFieldError('firstName'); }} editable={!isLoading} />
              </View>
                {fieldErrors.firstName ? <Text style={styles.fieldErrorText}>{t(fieldErrors.firstName)}</Text> : null}
              </View>
              <View style={styles.fieldWrapper}>
                <View style={[styles.inputContainer, styles.nameField, fieldErrors.lastName && styles.inputContainerError]}>
                <TextInput style={styles.input} placeholder={t('auth_last_name')} value={lastName} onChangeText={value => { setLastName(value); clearFieldError('lastName'); }} editable={!isLoading} />
              </View>
                {fieldErrors.lastName ? <Text style={styles.fieldErrorText}>{t(fieldErrors.lastName)}</Text> : null}
              </View>
            </View>

            <View style={styles.fieldWrapper}>
              <View style={[styles.inputContainer, fieldErrors.email && styles.inputContainerError]}>
                <Mail size={20} color={colors.textSubtle} />
                <TextInput style={styles.input} placeholder={t('auth_email')} value={email} onChangeText={value => { setEmail(value); clearFieldError('email'); }} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
              </View>
              {fieldErrors.email ? <Text style={styles.fieldErrorText}>{t(fieldErrors.email)}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={colors.textSubtle} />
              <TextInput style={styles.input} placeholder={t('auth_phone_optional')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!isLoading} />
            </View>

            <View style={styles.fieldWrapper}>
              <View style={[styles.inputContainer, fieldErrors.password && styles.inputContainerError]}>
                <Lock size={20} color={colors.textSubtle} />
                <TextInput style={styles.input} placeholder={t('auth_password')} value={password} onChangeText={value => { setPassword(value); clearFieldError('password'); clearFieldError('confirmPassword'); }} secureTextEntry={!showPassword} editable={!isLoading} />
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
              {fieldErrors.password ? <Text style={styles.fieldErrorText}>{t(fieldErrors.password)}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
              <View style={[styles.inputContainer, fieldErrors.confirmPassword && styles.inputContainerError]}>
                <Lock size={20} color={colors.textSubtle} />
                <TextInput style={styles.input} placeholder={t('auth_confirm_password')} value={confirmPassword} onChangeText={value => { setConfirmPassword(value); clearFieldError('confirmPassword'); }} secureTextEntry={!showPassword} editable={!isLoading} />
              </View>
              {fieldErrors.confirmPassword ? <Text style={styles.fieldErrorText}>{t(fieldErrors.confirmPassword)}</Text> : null}
            </View>

            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth_register')}</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.loginText}>{t('auth_have_account')} <Text style={styles.loginTextBold}>{t('auth_login_link')}</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.tint },
  errorContainer: { backgroundColor: colors.surfaceMuted, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center' },
  form: { width: '100%' },
  nameRow: { flexDirection: 'row', gap: Spacing.md },
  fieldWrapper: { flex: 1 },
  nameField: { flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: Radius.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  inputContainerError: { borderWidth: 1, borderColor: colors.error, marginBottom: Spacing.xs },
  fieldErrorText: { color: colors.error, fontSize: 12, marginBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: Spacing.lg, fontSize: 16, color: colors.text },
  button: { backgroundColor: colors.tint, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginButton: { alignItems: 'center', padding: Spacing.lg, marginTop: Spacing.lg },
  loginText: { color: colors.textMuted, fontSize: 14 },
  loginTextBold: { color: colors.tint, fontWeight: '600' },
});
