import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface SubscriptionManager {
  subscription: unknown;
  isActive: boolean;
  lastStatus: string;
}

interface UseSupabaseSubscriptionOptions {
  onConnectionLost?: () => void;
  onReconnected?: () => void;
  enableToasts?: boolean;
  debugLabel?: string;
}

/**
 * Hook to manage Supabase subscription lifecycle with automatic reconnection
 * after phone lock/unlock and network interruptions
 */
export const useSupabaseSubscription = (
  createSubscriptionFn: () => unknown,
  deps: unknown[] = [],
  options: UseSupabaseSubscriptionOptions = {}
) => {
  const subscriptionRef = useRef<SubscriptionManager>({
    subscription: null,
    isActive: false,
    lastStatus: "disconnected",
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    onConnectionLost,
    onReconnected,
    enableToasts = false,
    debugLabel = "Supabase",
  } = options;

  // Create or recreate subscription
  const createSubscription = useCallback(() => {
    console.log(`${debugLabel}: Creating subscription`);

    // Clean up existing subscription first
    if (subscriptionRef.current.subscription) {
      try {
        subscriptionRef.current.subscription.unsubscribe();
      } catch (error) {
        console.warn(`${debugLabel}: Error unsubscribing:`, error);
      }
    }

    try {
      const subscription = createSubscriptionFn();

      if (subscription && subscription.subscribe) {
        // Monitor subscription status for connection health
        subscription.subscribe((status: string) => {
          const prevStatus = subscriptionRef.current.lastStatus;
          subscriptionRef.current.lastStatus = status;

          console.log(
            `${debugLabel}: Subscription status changed:`,
            prevStatus,
            "->",
            status
          );

          if (status === "SUBSCRIBED") {
            subscriptionRef.current.isActive = true;
            if (prevStatus === "CLOSED" || prevStatus === "CHANNEL_ERROR") {
              console.log(`${debugLabel}: Reconnected successfully`);
              if (enableToasts) {
                toast.success("Connection restored");
              }
              onReconnected?.();
            }
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            subscriptionRef.current.isActive = false;
            console.log(
              `${debugLabel}: Connection lost, will attempt reconnection`
            );
            if (enableToasts) {
              toast.error("Connection lost");
            }
            onConnectionLost?.();

            // Schedule reconnection attempt
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              if (document.visibilityState === "visible") {
                console.log(`${debugLabel}: Attempting automatic reconnection`);
                createSubscription();
              }
            }, 2000);
          }
        });

        subscriptionRef.current.subscription = subscription;
      }
    } catch (error) {
      console.error(`${debugLabel}: Failed to create subscription:`, error);
      if (enableToasts) {
        toast.error("Failed to establish connection");
      }
    }
  }, [
    createSubscriptionFn,
    onConnectionLost,
    onReconnected,
    enableToasts,
    debugLabel,
    ...deps,
  ]);

  // Handle multiple unlock detection events (phone lock/unlock)
  const handleUnlockDetected = useCallback(
    (eventType: string) => {
      console.log(
        `${debugLabel}: Phone unlock detected via ${eventType} - triggering recovery`
      );

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Always trigger reconnection callback for state sync, even if subscription appears active
      // This is crucial for phone lock scenarios where subscription stays active but misses updates
      console.log(`${debugLabel}: Forcing state sync after unlock detection`);
      onReconnected?.();

      // For phone lock scenarios, always recreate subscription after visibility change
      // This is more aggressive but necessary since subscriptions can appear active but be dead
      console.log(
        `${debugLabel}: Aggressively reconnecting subscription after phone unlock`
      );
      createSubscription();
    },
    [createSubscription, debugLabel, onReconnected]
  );

  // Handle visibility changes (phone lock/unlock)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      handleUnlockDetected("visibilitychange");
    } else {
      console.log(`${debugLabel}: App went to background`);
    }
  }, [handleUnlockDetected, debugLabel]);

  // Set up subscription and multiple unlock detection listeners
  useEffect(() => {
    createSubscription();

    // Multiple event listeners to catch phone unlock more reliably
    const handleFocus = () => handleUnlockDetected("focus");
    const handlePageShow = () => handleUnlockDetected("pageshow");
    const handleOnline = () => handleUnlockDetected("online");
    const handleTouchStart = () => {
      // Only trigger once per session to avoid spam
      handleUnlockDetected("touchstart");
      window.removeEventListener("touchstart", handleTouchStart);
    };

    // Primary visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Additional unlock detection events
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("online", handleOnline);
    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
      once: true,
    });

    console.log(`${debugLabel}: Set up multiple unlock detection listeners`);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("touchstart", handleTouchStart);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (subscriptionRef.current.subscription) {
        try {
          subscriptionRef.current.subscription.unsubscribe();
        } catch (error) {
          console.warn(`${debugLabel}: Error cleaning up subscription:`, error);
        }
      }
    };
  }, [
    createSubscription,
    handleVisibilityChange,
    handleUnlockDetected,
    debugLabel,
  ]);

  // Return subscription health info
  return {
    isActive: subscriptionRef.current.isActive,
    lastStatus: subscriptionRef.current.lastStatus,
    reconnect: createSubscription,
  };
};
