"use client";

import { config } from "@config";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { SettingsItem } from "@shared/components/SettingsItem";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function LogoutBlock() {
	const t = useTranslations();

	const onLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = new URL(
						config.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	return (
		<SettingsItem
			title={t("settings.account.security.logout.title")}
			description={t("settings.account.security.logout.description")}
		>
			<div className="flex justify-end">
				<Button variant="secondary" onClick={() => onLogout()}>
					<LogOutIcon className="mr-2 size-4" />
					{t("settings.account.security.logout.submit")}
				</Button>
			</div>
		</SettingsItem>
	);
}
