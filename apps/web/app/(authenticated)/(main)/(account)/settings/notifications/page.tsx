import { getSession } from "@auth/lib/server";
import { NotificationPreferencesForm } from "@settings/components/NotificationPreferencesForm";
import { SendTestNotificationCard } from "@settings/components/SendTestNotificationCard";
import { WebPushCard } from "@settings/components/WebPushCard";
import { SettingsList } from "@shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.notificationsPage");

	return {
		title: t("title"),
	};
}

export default async function NotificationSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<SettingsList>
			<WebPushCard />
			<SendTestNotificationCard />
			<NotificationPreferencesForm />
		</SettingsList>
	);
}
