import { getSession } from "@auth/lib/server";
import { BrandLogoForm } from "@settings/components/BrandLogoForm";
import { ChangeEmailForm } from "@settings/components/ChangeEmailForm";
import { ChangeNameForm } from "@settings/components/ChangeNameForm";
import { DeleteAccountForm } from "@settings/components/DeleteAccountForm";
import { SidebarModulesForm } from "@settings/components/SidebarModulesForm";
import { TimezoneForm } from "@settings/components/TimezoneForm";
import { UserAvatarForm } from "@settings/components/UserAvatarForm";
import { SettingsList } from "@shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.account");

	return {
		title: t("title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<SettingsList>
			<UserAvatarForm />
			<TimezoneForm />
			<SidebarModulesForm />
			<BrandLogoForm />
			<ChangeNameForm />
			<ChangeEmailForm />
			<DeleteAccountForm />
		</SettingsList>
	);
}
