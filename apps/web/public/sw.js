// Tophe Web Push service worker. Deliberately minimal: it only handles push
// delivery and notification clicks - no fetch interception, no caching - so it
// cannot interfere with the app. It is registered only after the user opts in.

self.addEventListener("push", (event) => {
	let payload = {};
	try {
		payload = event.data ? event.data.json() : {};
	} catch {
		payload = { title: "Tophe", body: event.data ? event.data.text() : "" };
	}

	const title = payload.title || "Tophe";
	const options = {
		body: payload.body || "",
		icon: "/apple-icon",
		badge: "/apple-icon",
		tag: "tophe-notification",
		data: { link: payload.link || "/" },
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const link = (event.notification.data && event.notification.data.link) || "/";

	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clients) => {
				for (const client of clients) {
					if ("focus" in client) {
						client.navigate(link);
						return client.focus();
					}
				}
				return self.clients.openWindow(link);
			}),
	);
});
