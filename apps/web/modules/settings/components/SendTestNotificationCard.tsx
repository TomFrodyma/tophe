"use client";

import { Button } from "@repo/ui/components/button";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export function SendTestNotificationCard() {
	const t = useTranslations("settings.notificationsPage.test");
	const queryClient = useQueryClient();

	const mutation = useMutation(
		orpc.notifications.sendTest.mutationOptions({
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: orpc.notifications.unreadCount.queryKey({ input: {} }),
					}),
					queryClient.invalidateQueries({
						queryKey: orpc.notifications.list.queryKey({ input: {} }),
					}),
				]);
				toastSuccess(t("success"));
			},
			onError: () => {
				toastError(t("error"));
			},
		}),
	);

	return (
		<SettingsItem title={t("title")} description={t("description")}>
			<Button
				type="button"
				onClick={() => mutation.mutate({})}
				loading={mutation.isPending}
				disabled={mutation.isPending}
			>
				{t("button")}
			</Button>
		</SettingsItem>
	);
}
