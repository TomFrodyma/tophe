"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

function getTimeZoneOptions(): string[] {
	const maybe = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
		.supportedValuesOf;
	if (typeof maybe === "function") {
		try {
			return maybe("timeZone");
		} catch {
			// fall through
		}
	}
	return [
		"UTC",
		"Europe/London",
		"Europe/Prague",
		"Europe/Berlin",
		"Europe/Paris",
		"Europe/Amsterdam",
		"America/New_York",
		"America/Chicago",
		"America/Los_Angeles",
		"Asia/Tokyo",
		"Asia/Singapore",
		"Australia/Sydney",
	];
}

export function TimezoneForm() {
	const t = useTranslations();
	const { user, reloadSession } = useSession();
	const current =
		(user as { timezone?: string } | null)?.timezone ??
		Intl.DateTimeFormat().resolvedOptions().timeZone ??
		"UTC";
	const [timezone, setTimezone] = useState<string>(current);

	const options = useMemo(() => getTimeZoneOptions(), []);

	const updateTimezoneMutation = useMutation({
		mutationFn: async (nextTimezone: string) => {
			await authClient.updateUser({ timezone: nextTimezone });
			await reloadSession();
		},
	});

	const save = async (nextTimezone: string) => {
		try {
			setTimezone(nextTimezone);
			await updateTimezoneMutation.mutateAsync(nextTimezone);
			toastSuccess(t("settings.account.timezone.notifications.success"));
		} catch {
			toastError(t("settings.account.timezone.notifications.error"));
		}
	};

	return (
		<SettingsItem
			title={t("settings.account.timezone.title")}
			description={t("settings.account.timezone.description")}
		>
			<Select
				value={timezone}
				onValueChange={(value) => {
					void save(value);
				}}
				disabled={updateTimezoneMutation.isPending}
			>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="max-h-80">
					{options.map((tz) => (
						<SelectItem key={tz} value={tz}>
							{tz}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</SettingsItem>
	);
}
