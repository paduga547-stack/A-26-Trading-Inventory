import { useState, useEffect, useCallback } from 'react';
import { OfflineQueueItem, DeliveryStatus } from '../types';

const QUEUE_STORAGE_KEY = 'a26_driver_offline_queue_v1';

export function useOfflineSyncQueue(
  onApplySyncItem?: (item: OfflineQueueItem) => void
) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enqueueAction = useCallback(
    (
      type: 'STATUS_UPDATE' | 'POD_SIGNATURE' | 'COD_COLLECTED' | 'GPS_UPDATE',
      deliveryId: string | undefined,
      payload: any
    ) => {
      const newItem: OfflineQueueItem = {
        id: `OFL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        deliveryId,
        payload,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      setQueue((prev) => [...prev, newItem]);
    },
    []
  );

  const triggerSync = useCallback(async (): Promise<number> => {
    if (queue.length === 0) return 0;
    setIsSyncing(true);

    try {
      // Simulate/perform syncing to central database
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Process each queue item
      if (onApplySyncItem) {
        queue.forEach((item) => {
          onApplySyncItem(item);
        });
      }

      const count = queue.length;
      setQueue([]);
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      setIsSyncing(false);
      return count;
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
      setIsSyncing(false);
      return 0;
    }
  }, [queue, onApplySyncItem]);

  return {
    isOnline,
    pendingCount: queue.length,
    queue,
    isSyncing,
    enqueueAction,
    forceSync: triggerSync,
  };
}
