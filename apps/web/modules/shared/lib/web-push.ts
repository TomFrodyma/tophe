import { orpcClient } from "@shared/lib/orpc-client";

/**
 * Browser / installed-PWA Web Push (RFC 8291). The service worker (`/sw.js`) is
 * registered only when the user opts in here - nothing runs until they do. The
 * push payload is encrypted end-to-end with the subscription's own keys, so the
 * push service only relays ciphertext.
 */

const SW_URL = "/sw.js";

export type WebPushState = "unsupported" | "denied" | "subscribed" | "idle";

export function isWebPushSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

export function isIos(): boolean {
	if (typeof navigator === "undefined") return false;
	return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// iOS only delivers Web Push to a PWA added to the Home Screen (running standalone).
export function isStandalone(): boolean {
	if (typeof window === "undefined") return false;
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		(navigator as { standalone?: boolean }).standalone === true
	);
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(normalized);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
}

async function getOrRegister(): Promise<ServiceWorkerRegistration> {
	const existing = await navigator.serviceWorker.getRegistration(SW_URL);
	return existing ?? (await navigator.serviceWorker.register(SW_URL));
}

export async function getWebPushState(): Promise<WebPushState> {
	if (!isWebPushSupported()) return "unsupported";
	if (Notification.permission === "denied") return "denied";
	try {
		const registration = await navigator.serviceWorker.getRegistration(SW_URL);
		const subscription = registration ? await registration.pushManager.getSubscription() : null;
		return subscription ? "subscribed" : "idle";
	} catch {
		return "idle";
	}
}

export async function enableWebPush(): Promise<WebPushState> {
	if (!isWebPushSupported()) return "unsupported";

	// The server generates the key pair on first ask, so this always resolves
	// on a working install.
	const { publicKey } = await orpcClient.notifications.webPushPublicKey({});
	if (!publicKey) return "unsupported";

	const permission = await Notification.requestPermission();
	if (permission !== "granted") return permission === "denied" ? "denied" : "idle";

	const registration = await getOrRegister();
	await navigator.serviceWorker.ready;

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
	});

	const json = subscription.toJSON();
	await orpcClient.notifications.subscribeWebPush({
		endpoint: subscription.endpoint,
		keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
		userAgent: navigator.userAgent.slice(0, 512),
	});

	return "subscribed";
}

export async function disableWebPush(): Promise<WebPushState> {
	const registration = await navigator.serviceWorker.getRegistration(SW_URL);
	const subscription = registration ? await registration.pushManager.getSubscription() : null;
	if (subscription) {
		await orpcClient.notifications
			.unsubscribeWebPush({ endpoint: subscription.endpoint })
			.catch(() => {});
		await subscription.unsubscribe().catch(() => {});
	}
	return "idle";
}
