import { getSession } from "@auth/lib/server";
import { SettingsMenu } from "@settings/components/SettingsMenu";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations();

	const items = [
		{ title: t("settings.menu.account.general"), href: "/settings/general" },
		{ title: t("settings.menu.account.security"), href: "/settings/security" },
		{ title: t("settings.menu.account.notifications"), href: "/settings/notifications" },
		{ title: t("settings.menu.account.integrations"), href: "/settings/integrations" },
		// The admin panel lives here rather than in the sidebar - fresh installs
		// shouldn't lead with a user-management screen.
		...(session.user.role === "admin"
			? [{ title: t("app.menu.admin"), href: "/admin" }]
			: []),
	];

	return (
		<>
			<PageHeader
				title={t("settings.account.title")}
				subtitle={t("settings.account.subtitle")}
			/>

			<SettingsMenu className="mb-6" menuItems={[{ avatar: null, title: "", items }]} />

			{children}
		</>
	);
}
