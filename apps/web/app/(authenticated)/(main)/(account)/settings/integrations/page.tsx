import { getSession } from "@auth/lib/server";
import { OutlookIntegrationForm } from "@calendar/components/OutlookIntegrationForm";
import { SettingsList } from "@shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.integrationsPage");
	return { title: t("title") };
}

export default async function IntegrationsSettingsPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	return (
		<SettingsList>
			<OutlookIntegrationForm />
		</SettingsList>
	);
}
