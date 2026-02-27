self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "New Message";
  const options = {
    body: data.body || "",
    tag: data.tag || "chat-message",
    renotify: true,
    data: {
      url: data.url || "/portal",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/portal";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
