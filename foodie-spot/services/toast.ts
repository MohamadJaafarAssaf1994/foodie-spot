import { Alert } from 'react-native';

import { ToastOptions, ToastType } from '@/types';

const toast = {
    success: (message: string, _options?: ToastOptions) => {
        Alert.alert("✅ Succès", message);
    },
    error: (message: string, _options?: ToastOptions) => {
        Alert.alert("❌ Erreur", message);
    },
    info: (message: string, _options?: ToastOptions) => {
        Alert.alert("ℹ️ Info", message);
    },
    warning: (message: string, _options?: ToastOptions) => {
        Alert.alert("⚠️ Attention", message);
    },
    show: (message: string,  type: ToastType = 'info', _options?: ToastOptions) => {
        const titles : Record<ToastType, string> = {
            success: "✅ Succès",
            error: "❌ Erreur",
            info: "ℹ️ Info",
            warning: "⚠️ Attention"
        };
        Alert.alert(titles[type], message);
    }
}

export default toast;
