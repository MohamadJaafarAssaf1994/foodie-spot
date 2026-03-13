// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) { setLocalError('Veuillez entrer votre email'); return; }
    if (!email.includes('@')) { setLocalError('Email invalide'); return; }
    if (!password) { setLocalError('Veuillez entrer votre mot de passe'); return; }

    setLocalError('');
    try {
      await login({ email: email.trim(), password });
    } catch {
      console.log('Login error handled');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>FoodieSpot</Text>
            <Text style={styles.subtitle}>Connectez-vous pour commander</Text>
          </View>

          {displayError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#999" />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={t => { setEmail(t); setLocalError(''); }} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#999" />
              <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#999" value={password} onChangeText={t => { setPassword(t); setLocalError(''); }} secureTextEntry={!showPassword} editable={!isLoading} />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                hitSlop={8}
                style={styles.iconButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} color="#999" /> : <Eye size={20} color="#999" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotButton} accessibilityRole="button">
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/(auth)/register')} disabled={isLoading}>
            <Text style={styles.registerText}>Pas encore de compte ? <Text style={styles.registerTextBold}>S&apos;inscrire</Text></Text>
          </TouchableOpacity>

          <View style={styles.demoHint}>
            <Text style={styles.demoHintText}>💡 Pour tester, utilisez n&apos;importe quel email/mot de passe</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.light.tint, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.light.textMuted },
  errorContainer: { backgroundColor: '#FEF2F2', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  errorText: { color: Colors.light.error, fontSize: 14, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.surfaceMuted, borderRadius: Radius.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: Spacing.lg, fontSize: 16, color: Colors.light.text },
  forgotButton: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotText: { color: Colors.light.tint, fontSize: 14 },
  button: { backgroundColor: Colors.light.tint, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerButton: { alignItems: 'center', padding: Spacing.lg, marginTop: Spacing.xl },
  registerText: { color: Colors.light.textMuted, fontSize: 14 },
  registerTextBold: { color: Colors.light.tint, fontWeight: '600' },
  demoHint: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.light.surfaceMuted, borderRadius: Radius.sm },
  demoHintText: { fontSize: 12, color: Colors.light.warning, textAlign: 'center' },
});
