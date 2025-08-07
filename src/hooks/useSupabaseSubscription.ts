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

  // Handle visibility changes (phone lock/unlock)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      console.log(
        `${debugLabel}: App became visible - checking connection health`
      );

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Check if we need to reconnect
      if (
        !subscriptionRef.current.isActive ||
        subscriptionRef.current.lastStatus === "CLOSED" ||
        subscriptionRef.current.lastStatus === "CHANNEL_ERROR"
      ) {
        console.log(`${debugLabel}: Reconnecting after visibility change`);
        createSubscription();
      }
    } else {
      console.log(`${debugLabel}: App went to background`);
    }
  }, [createSubscription, debugLabel]);

  // Set up subscription and visibility listener
  useEffect(() => {
    createSubscription();

    // Listen for visibility changes (phone lock/unlock, tab switching)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

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
  }, [createSubscription, handleVisibilityChange]);

  // Return subscription health info
  return {
    isActive: subscriptionRef.current.isActive,
    lastStatus: subscriptionRef.current.lastStatus,
    reconnect: createSubscription,
  };
};
