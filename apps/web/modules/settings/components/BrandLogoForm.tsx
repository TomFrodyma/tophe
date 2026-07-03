"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function BrandLogoForm() {
	const t = useTranslations();
	const { user, reloadSession } = useSession();
	const current = (user as { showBrandLogo?: boolean } | null)?.showBrandLogo !== false;
	const [showBrandLogo, setShowBrandLogo] = useState(current);

	const updateMutation = useMutation({
		mutationFn: async (next: boolean) => {
			await authClient.updateUser({ showBrandLogo: next });
			await reloadSession();
		},
	});

	const save = async (next: boolean) => {
		try {
			setShowBrandLogo(next);
			await updateMutation.mutateAsync(next);
			toastSuccess(t("settings.account.brandLogo.notifications.success"));
		} catch {
			setShowBrandLogo(!next);
			toastError(t("settings.account.brandLogo.notifications.error"));
		}
	};

	return (
		<SettingsItem
			title={t("settings.account.brandLogo.title")}
			description={t("settings.account.brandLogo.description")}
		>
			<Switch
				checked={showBrandLogo}
				onCheckedChange={(value) => {
					void save(value);
				}}
				disabled={updateMutation.isPending}
				aria-label={t("settings.account.brandLogo.title")}
			/>
		</SettingsItem>
	);
}
