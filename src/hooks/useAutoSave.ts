import { useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAutoSave({
  key,
  data,
  delay = 2000,
  enabled = true,
  onSave,
  onError,
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const saveToStorage = useCallback((dataToSave: any) => {
    try {
      const serializedData = JSON.stringify(dataToSave);
      
      // Only save if data has actually changed
      if (serializedData !== lastSavedRef.current) {
        localStorage.setItem(key, serializedData);
        localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
        lastSavedRef.current = serializedData;
        onSave?.(dataToSave);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      onError?.(error as Error);
    }
  }, [key, onSave, onError]);

  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
    lastSavedRef.current = '';
  }, [key]);

  const loadSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      
      if (saved && timestamp) {
        const savedTime = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only return saved data if it's less than 24 hours old
        if (hoursDiff < 24) {
          return {
            data: JSON.parse(saved),
            timestamp: savedTime,
            hoursAgo: Math.round(hoursDiff * 10) / 10,
          };
        } else {
          // Clean up old data
          clearAutoSave();
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      clearAutoSave();
    }
    return null;
  }, [key, clearAutoSave]);

  // Optimized auto-save effect with change detection and debouncing
  useEffect(() => {
    if (!enabled || !data) return;

    // Check if data actually changed to avoid unnecessary saves
    const currentDataString = JSON.stringify(data);
    const lastSavedString = localStorage.getItem(key);
    const lastSavedData = lastSavedString ? JSON.parse(lastSavedString) : null;
    const lastSavedDataString = JSON.stringify(lastSavedData);

    // Skip if data hasn't changed
    if (currentDataString === lastSavedDataString) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save with longer delay for better performance
    timeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveToStorage, key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    clearAutoSave,
    loadSavedData,
    saveNow: () => saveToStorage(data),
  };
}

export default useAutoSave;