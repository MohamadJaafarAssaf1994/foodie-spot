
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notifications, NotificationPayload, NotificationPreferences, PushToken } from "@/services/notification";

export const useNotifications = (
    onReceived?: (notification: Notifications.Notification) => void,
    onTapped?: (data: Notifications.NotificationResponse['notification']['request']['content']['data']) => void
) => {
    const [pushToken, setPushToken] = useState<PushToken | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);
    const [isDevice, setIsDevice] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanupRef = useRef<(() => void) | null>(null);

    const loadData = useCallback(async () => {
        try {
            setError(null);
            const state = await notifications.getState();
            setPushToken(state.pushToken);
            setPreferences(state.preferences);
            setBadgeCount(state.badgeCount);
            setScheduled(state.scheduled);
            setPermissionStatus(state.permissionStatus);
            setIsDevice(state.isDevice);
            setHasPermission(state.permissionStatus === 'granted');
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications state.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setupListeners = useCallback(() => {
        cleanupRef.current = notifications.setupListeners(
            (n) => onReceived?.(n),
            (r) => onTapped?.(r.notification.request.content.data)
        );
    }, [onReceived, onTapped]);

    useEffect(() => {
        void loadData();
        setupListeners();
        return () => cleanupRef.current?.();
    }, [loadData, setupListeners]);

    const initialize = useCallback(async () => {
        setIsLoading(true);
        try {
            setError(null);
            const token = await notifications.initialize();
            await loadData();
            setPushToken(token);
            return token;
        } catch (initError) {
            setError(initError instanceof Error ? initError.message : 'Unable to initialize notifications.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);

    const send = useCallback((title: string, body: string, data?: NotificationPayload) => {
        return notifications.send(title, body, data);
    }, []);

    const refreshScheduled = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const schedule = useCallback(async (title: string, body: string, date: Date, data?: NotificationPayload) => {
        const id = await notifications.schedule(title, body, date, data);
        await refreshScheduled();
        return id;
    }, [refreshScheduled]);



    const scheduleTripReminder = useCallback(async (id: string, title: string, date: Date) => {
        const id_ = await notifications.scheduleTripReminder(id, title, date);
        await refreshScheduled();
        return id_;
    }, [refreshScheduled]);


    const cancel = useCallback(async (id: string) => {
        await notifications.cancel(id);
        await refreshScheduled();
    }, [refreshScheduled]);

    const cancelAll = useCallback(async () => {
        await notifications.cancelAll();
        await refreshScheduled();
    }, [refreshScheduled]);

    const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
        const current = preferences || await notifications.getPreferences();
        const updated = { ...current, ...updates };
        await notifications.savePreferences(updated);
        setPreferences(updated);
    }, [preferences]);

    const updateBadge = useCallback(async (count: number) => {
        await notifications.setBadge(count);
        setBadgeCount(count)
    }, []);

    const clearBadge = useCallback(async () => {
        await notifications.clearBadge();
        setBadgeCount(0)
    }, []);


    return {
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
        scheduleTripReminder,
        cancel,
        cancelAll,
        updatePreferences,
        setBadgeCount: updateBadge,
        clearBadge,
        refreshScheduled,
    };
}

export const useLastNotificationResponse = () => {
    const [response, setResponse] = useState<Notifications.NotificationResponse | null>(null);
    useEffect(() => {
        Notifications.getLastNotificationResponseAsync().then((r) => {
            if (r) setResponse(r);
        });
    }, []);

    return response;
}
