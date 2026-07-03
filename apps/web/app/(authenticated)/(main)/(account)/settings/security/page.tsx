import { userAccountQueryKey } from "@auth/lib/api";
import { getSession, getUserAccounts } from "@auth/lib/server";
import { config } from "@repo/auth/config";
import { ActiveSessionsBlock } from "@settings/components/ActiveSessionsBlock";
import { ChangePasswordForm } from "@settings/components/ChangePassword";
import { LogoutBlock } from "@settings/components/LogoutBlock";
import { SetPasswordForm } from "@settings/components/SetPassword";
import { TwoFactorBlock } from "@settings/components/TwoFactorBlock";
import { SettingsList } from "@shared/components/SettingsList";
import { getServerQueryClient } from "@shared/lib/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.account.security");

	return {
		title: t("title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const userAccounts = await getUserAccounts();

	const userHasPassword = userAccounts?.some((account) => account.providerId === "credential");

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: userAccountQueryKey,
		queryFn: () => getUserAccounts(),
	});

	return (
		<SettingsList>
			{config.enablePasswordLogin &&
				(userHasPassword ? <ChangePasswordForm /> : <SetPasswordForm />)}
			{config.enableTwoFactor && <TwoFactorBlock />}
			<ActiveSessionsBlock />
			<LogoutBlock />
		</SettingsList>
	);
}
