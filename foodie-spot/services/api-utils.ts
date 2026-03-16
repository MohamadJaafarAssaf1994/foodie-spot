import axios, { AxiosError } from 'axios';
import type { Order } from '@/types';

export interface ApiEnvelope<T> {
  data?: T;
}

export interface FailedOfflineOrder {
  id?: string;
}

export const getResponseData = <T>(response: { data?: ApiEnvelope<T> | T }): T => {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return error.response?.status;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Une erreur est survenue.'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.code === 'ECONNABORTED') {
      return 'La requete a pris trop de temps. Veuillez reessayer.';
    }

    if (!axiosError.response) {
      return 'Impossible de contacter le serveur. Verifiez votre connexion.';
    }

    const apiMessage = axiosError.response.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const getRemainingOfflineOrders = (
  offlineOrders: Order[],
  failedOrders?: FailedOfflineOrder[]
): Order[] => {
  const failedIds = new Set((failedOrders || []).map(order => order.id).filter(Boolean));
  if (failedIds.size === 0) {
    return [];
  }

  return offlineOrders.filter(order => failedIds.has(order.id));
};
