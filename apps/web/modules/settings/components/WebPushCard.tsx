"use client";

import { Button } from "@repo/ui/components/button";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import {
	disableWebPush,
	enableWebPush,
	getWebPushState,
	isIos,
	isStandalone,
	isWebPushSupported,
	type WebPushState,
} from "@shared/lib/web-push";
import { useEffect, useState } from "react";

// English copy inline - single-user English app. Wire next-intl keys
// here if Tophe ever ships to other people.
export function WebPushCard() {
	const [state, setState] = useState<WebPushState | "loading">("loading");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		getWebPushState()
			.then(setState)
			.catch(() => setState("idle"));
	}, []);

	const enable = async () => {
		setBusy(true);
		try {
			const next = await enableWebPush();
			setState(next);
			if (next === "subscribed") {
				toastSuccess("Notifications are on for this device.");
			} else if (next === "denied") {
				toastError("Notifications are blocked in your browser settings.");
			}
		} catch {
			toastError("Couldn't enable notifications on this device.");
		} finally {
			setBusy(false);
		}
	};

	const disable = async () => {
		setBusy(true);
		try {
			setState(await disableWebPush());
			toastSuccess("Notifications are off for this device.");
		} catch {
			toastError("Couldn't turn notifications off.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<SettingsItem
			title="Push on this device"
			description="Get notifications even when Tophe is closed. They're encrypted end to end - only this device can read them; the push service just relays sealed messages."
		>
			{state === "loading" ? null : !isWebPushSupported() ? (
				<p className="max-w-md text-sm text-muted-foreground">
					This browser doesn't support web push.
				</p>
			) : isIos() && !isStandalone() ? (
				<p className="max-w-md text-sm text-muted-foreground">
					On iPhone, add Tophe to your Home Screen first (Share → Add to Home Screen),
					then open it from there and enable push.
				</p>
			) : state === "denied" ? (
				<p className="max-w-md text-sm text-muted-foreground">
					Notifications are blocked. Allow them for this site in your browser settings,
					then reload.
				</p>
			) : state === "subscribed" ? (
				<Button type="button" variant="outline" onClick={disable} loading={busy} disabled={busy}>
					Turn off on this device
				</Button>
			) : (
				<Button type="button" onClick={enable} loading={busy} disabled={busy}>
					Enable on this device
				</Button>
			)}
		</SettingsItem>
	);
}
