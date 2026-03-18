// Service Worker for BeeHunter Push Notifications

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker");
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received", event);

  if (!event.data) {
    console.log("[SW] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    const options = {
      body: body || "Nuova notifica da BeeHunter",
      icon: icon || "/bee-icon.png",
      badge: badge || "/bee-badge.png",
      tag: tag || "beehunter-notification",
      data: notificationData || {},
      actions: [
        {
          action: "open",
          title: "Apri",
        },
        {
          action: "close",
          title: "Chiudi",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title || "BeeHunter", options)
    );
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);
    event.waitUntil(
      self.registration.showNotification("BeeHunter", {
        body: event.data.text(),
        icon: "/bee-icon.png",
      })
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked", event);

  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

  if (event.action === "close") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed", event);
});

// Background sync for offline notifications
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(
      fetch("/api/notifications/sync", { method: "POST" })
        .then((response) => response.json())
        .then((data) => {
          console.log("[SW] Notifications synced:", data);
        })
        .catch((error) => {
          console.error("[SW] Sync failed:", error);
          throw error;
        })
    );
  }
});
