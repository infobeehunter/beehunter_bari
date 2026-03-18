import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register device token
  const registerTokenMutation = trpc.notification.registerDeviceToken.useMutation();

  useEffect(() => {
    // Check if browser supports push notifications
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);

      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Push] Service worker registered:", reg);
          setRegistration(reg);

          // Check if already subscribed
          reg.pushManager.getSubscription().then((subscription) => {
            setIsSubscribed(!!subscription);
          });
        })
        .catch((error) => {
          console.error("[Push] Service worker registration failed:", error);
        });
    }
  }, []);

  const subscribe = async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
      });

      console.log("[Push] Subscribed:", subscription);

      // Send subscription to server
      const deviceToken = JSON.stringify(subscription);
      await registerTokenMutation.mutateAsync({ deviceToken });

      setIsSubscribed(true);
      return subscription;
    } catch (error) {
      console.error("[Push] Subscription failed:", error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log("[Push] Unsubscribed");
      }
    } catch (error) {
      console.error("[Push] Unsubscription failed:", error);
      throw error;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    registration,
  };
}
