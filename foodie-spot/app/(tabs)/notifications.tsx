import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ErrorState } from '@/components/error-state';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useNotifications } from '@/hooks/use-notifications';

const MAX_LOGS = 8;

export default function NotificationScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = useCallback((message: string) => {
    setTestResults(prev => {
      const entry = `${new Date().toLocaleTimeString()}: ${message}`;
      return [entry, ...prev].slice(0, MAX_LOGS);
    });
  }, []);

  const {
    pushToken,
    isLoading,
    hasPermission,
    permissionStatus,
    preferences,
    scheduled,
    badgeCount,
    isDevice,
    error,
    initialize,
    send,
    schedule,
    setBadgeCount,
    clearBadge,
    refreshScheduled,
  } = useNotifications(
    notification => {
      addTestResult(`Received: ${notification.request.content.title || 'Notification'}`);
    },
    data => {
      const payload = Object.keys(data || {}).length > 0 ? JSON.stringify(data) : 'no payload';
      addTestResult(`Opened: ${payload}`);
    }
  );

  const environmentLabel = isDevice ? t('notifications_device') : t('notifications_simulator');
  const permissionLabel = hasPermission ? t('notifications_permission_granted') : t('notifications_permission_denied');
  const preferenceRows = useMemo(
    () =>
      preferences
        ? [
            { key: 'enabled', label: 'Global', value: preferences.enabled },
            { key: 'tripReminders', label: 'Trip reminders', value: preferences.tripReminders },
            { key: 'newMessages', label: 'Messages', value: preferences.newMessages },
            { key: 'promotions', label: 'Promotions', value: preferences.promotions },
            { key: 'sound', label: 'Sound', value: preferences.sound },
          ]
        : [],
    [preferences]
  );

  const handleInitialize = useCallback(async () => {
    addTestResult('Initializing notifications...');
    const token = await initialize();
    if (token) {
      addTestResult(`Ready on ${token.platform}`);
    } else {
      addTestResult('Initialization blocked by permissions or device limits.');
    }
  }, [addTestResult, initialize]);

  const handleSendImmediate = useCallback(async () => {
    if (!hasPermission) {
      addTestResult('Notifications are not enabled yet.');
      return;
    }

    try {
      await send('Test Notification', 'This is an immediate notification test.');
      addTestResult('Immediate notification sent.');
    } catch (sendError) {
      addTestResult(sendError instanceof Error ? sendError.message : 'Unable to send notification.');
    }
  }, [addTestResult, hasPermission, send]);

  const handleSchedule = useCallback(
    async (seconds: number, title: string, body: string) => {
      if (!hasPermission) {
        addTestResult('Notifications are not enabled yet.');
        return;
      }

      const date = new Date(Date.now() + seconds * 1000);

      try {
        await schedule(title, body, date, { testType: `scheduled_${seconds}s` });
        addTestResult(`Scheduled for ${date.toLocaleTimeString()}.`);
      } catch (scheduleError) {
        addTestResult(scheduleError instanceof Error ? scheduleError.message : 'Unable to schedule notification.');
      }
    },
    [addTestResult, hasPermission, schedule]
  );

  const handleSetBadge = useCallback(async () => {
    try {
      await setBadgeCount(5);
      addTestResult('Badge updated to 5.');
    } catch (badgeError) {
      addTestResult(badgeError instanceof Error ? badgeError.message : 'Unable to update badge.');
    }
  }, [addTestResult, setBadgeCount]);

  const handleClearBadge = useCallback(async () => {
    try {
      await clearBadge();
      addTestResult('Badge cleared.');
    } catch (badgeError) {
      addTestResult(badgeError instanceof Error ? badgeError.message : 'Unable to clear badge.');
    }
  }, [addTestResult, clearBadge]);

  if (isLoading && !preferences) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>{t('notifications_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !preferences) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={t('notifications_error')} onAction={refreshScheduled} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[Colors.light.gradientStart, Colors.light.gradientEnd]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications_title')}</Text>
          <TouchableOpacity onPress={() => void refreshScheduled()} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>{t('notifications_refresh')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('notifications_state')}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('notifications_device_type')}</Text>
            <Text style={styles.statusValue}>{environmentLabel}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('notifications_permission_status')}</Text>
            <Text style={styles.statusValue}>{permissionStatus}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('notifications_permissions')}</Text>
            <Text style={styles.statusValue}>{permissionLabel}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('notifications_badge_count')}</Text>
            <Text style={styles.statusValue}>{badgeCount}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('notifications_scheduled_count')}</Text>
            <Text style={styles.statusValue}>{scheduled.length}</Text>
          </View>
          {pushToken ? (
            <View style={styles.tokenBlock}>
              <Text style={styles.tokenLabel}>Token</Text>
              <Text style={styles.tokenText} numberOfLines={1}>
                {pushToken.token}
              </Text>
            </View>
          ) : (
            <Text style={styles.hintText}>{t('notifications_init_hint')}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('notifications_actions')}</Text>
          <TouchableOpacity onPress={handleInitialize} disabled={isLoading} style={[styles.button, styles.primaryButton]}>
            <Ionicons name="notifications-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{t('notifications_initialize')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendImmediate} style={[styles.button, styles.successButton]}>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{t('notifications_immediate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleSchedule(5, 'Scheduled Notification', 'Appears in 5 seconds.')}
            style={[styles.button, styles.infoButton]}
          >
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{t('notifications_schedule_5')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleSchedule(30, 'Reminder', 'Appears in 30 seconds.')}
            style={[styles.button, styles.infoButton]}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{t('notifications_schedule_30')}</Text>
          </TouchableOpacity>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSetBadge} style={[styles.button, styles.smallButton, styles.warningButton]}>
              <Text style={styles.buttonText}>{t('notifications_badge_set')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearBadge} style={[styles.button, styles.smallButton, styles.dangerButton]}>
              <Text style={styles.buttonText}>{t('notifications_badge_clear')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('notifications_preferences')}</Text>
          {preferenceRows.map(item => (
            <View key={item.key} style={styles.statusRow}>
              <Text style={styles.statusLabel}>{item.label}</Text>
              <Text style={styles.statusValue}>
                {item.value ? t('notifications_enabled') : t('notifications_disabled')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>{t('notifications_logs')}</Text>
            {testResults.length > 0 ? (
              <TouchableOpacity onPress={() => setTestResults([])}>
                <Text style={styles.clearButton}>{t('notifications_clear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {testResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={44} color={Colors.light.textSubtle} />
              <Text style={styles.emptyText}>{t('notifications_no_results')}</Text>
              <Text style={styles.emptySubtext}>{t('notifications_no_results_subtext')}</Text>
            </View>
          ) : (
            testResults.map(result => (
              <View key={result} style={styles.logItem}>
                <Text style={styles.logText}>{result}</Text>
              </View>
            ))
          )}
        </View>

        {error ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    minWidth: 64,
    alignItems: 'flex-end',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  statusLabel: {
    flex: 1,
    color: Colors.light.textMuted,
  },
  statusValue: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  tokenBlock: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  tokenLabel: {
    color: Colors.light.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  tokenText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  hintText: {
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  successButton: {
    backgroundColor: Colors.light.success,
  },
  infoButton: {
    backgroundColor: Colors.light.info,
  },
  warningButton: {
    backgroundColor: Colors.light.warning,
  },
  dangerButton: {
    backgroundColor: Colors.light.error,
  },
  smallButton: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
  logItem: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  logText: {
    color: Colors.light.text,
  },
  inlineError: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inlineErrorText: {
    color: Colors.light.error,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  centerStateText: {
    color: Colors.light.textMuted,
  },
});
