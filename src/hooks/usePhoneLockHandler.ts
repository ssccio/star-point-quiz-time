import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface PhoneLockState {
  userState: unknown;
  timestamp: number;
  page: string;
}

interface UsePhoneLockHandlerOptions {
  storageKey: string;
  userState: unknown;
  onReconnect?: () => void | Promise<void>;
  enableToasts?: boolean;
}

/**
 * Hook to handle phone lock/unlock scenarios with state persistence and reconnection
 * 
 * Features:
 * - Detects when page becomes hidden/visible (phone lock/unlock)
 * - Persists user state during phone lock
 * - Handles network reconnection after unlock
 * - Shows appropriate user feedback
 * - Provides retry mechanisms for network operations
 */
export const usePhoneLockHandler = ({
  storageKey,
  userState,
  onReconnect,
  enableToasts = true,
}: UsePhoneLockHandlerOptions) => {
  const wasHiddenRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimeRef = useRef<number | null>(null);

  // Save state when it changes
  const saveState = useCallback(() => {
    if (userState && storageKey) {
      const stateToSave: PhoneLockState = {
        userState,
        timestamp: Date.now(),
        page: window.location.pathname + window.location.search,
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        console.log(`State saved for ${storageKey}:`, stateToSave);
      } catch (error) {
        console.error('Failed to save phone lock state:', error);
      }
    }
  }, [storageKey, userState]);

  // Load and restore state
  const restoreState = useCallback((): PhoneLockState | null => {
    if (!storageKey) return null;
    
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed: PhoneLockState = JSON.parse(savedState);
        console.log(`State restored for ${storageKey}:`, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to restore phone lock state:', error);
      // Clean up corrupted data
      localStorage.removeItem(storageKey);
    }
    
    return null;
  }, [storageKey]);

  // Clear saved state
  const clearState = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
      console.log(`State cleared for ${storageKey}`);
    }
  }, [storageKey]);

  // Handle visibility changes (phone lock/unlock)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isHidden = document.hidden || document.visibilityState === 'hidden';
      const isVisible = document.visibilityState === 'visible';

      if (isHidden) {
        // Phone is locking - save current state
        wasHiddenRef.current = true;
        lockTimeRef.current = Date.now();
        saveState();
        
        if (enableToasts) {
          console.log('Phone lock detected, state saved');
        }
      } else if (isVisible && wasHiddenRef.current) {
        // Phone is unlocking - restore and reconnect
        const lockDuration = lockTimeRef.current ? Date.now() - lockTimeRef.current : 0;
        wasHiddenRef.current = false;
        lockTimeRef.current = null;

        console.log(`Phone unlock detected after ${Math.round(lockDuration / 1000)}s`);

        // Brief delay to allow network to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check network connectivity
        if (!navigator.onLine) {
          if (enableToasts) {
            toast.error('No internet connection. Please check your connection.');
          }
          return;
        }

        // Show reconnecting message for longer locks
        if (lockDuration > 30000 && enableToasts) { // 30+ seconds
          toast.success('Welcome back! Reconnecting...');
        }

        // Attempt reconnection
        if (onReconnect) {
          try {
            await onReconnect();
          } catch (error) {
            console.error('Reconnection failed:', error);
            if (enableToasts) {
              toast.error('Connection issue. Please refresh if problems persist.');
            }
          }
        }
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for page focus (additional safety net)
    const handleFocus = () => {
      if (wasHiddenRef.current) {
        handleVisibilityChange();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [saveState, onReconnect, enableToasts]);

  // Auto-save state when it changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Utility function for retrying network operations
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add delay for retry attempts (not first attempt)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          
          if (enableToasts && attempt === 2) {
            toast.loading('Reconnecting...', { id: 'retry-operation' });
          }
        }

        const result = await operation();
        
        // Clear retry toast on success
        if (enableToasts && attempt > 1) {
          toast.dismiss('retry-operation');
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.log(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);

        // Don't retry for certain error types
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('game not found') || 
              message.includes('finished') || 
              message.includes('unauthorized')) {
            break;
          }
        }
      }
    }

    // Clear retry toast on final failure
    if (enableToasts) {
      toast.dismiss('retry-operation');
    }

    throw lastError!;
  }, [enableToasts]);

  return {
    restoreState,
    clearState,
    saveState,
    retryOperation,
    isOnline: navigator.onLine,
  };
};