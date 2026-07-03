import { getSession } from "@auth/lib/server";
import { Logo } from "@repo/ui";
import { SettingsMenu } from "@settings/components/SettingsMenu";
import { PageHeader } from "@shared/components/PageHeader";
import { UsersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (session.user?.role !== "admin") {
		redirect("/");
	}

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("description")} />

			<SettingsMenu
				className="mb-6"
				menuItems={[
					{
						avatar: (
							<Logo
								className="size-8"
								withLabel={false}
								brand={
									(session.user as { showBrandLogo?: boolean }).showBrandLogo !==
									false
								}
							/>
						),
						title: t("title"),
						items: [
							{
								title: t("menu.users"),
								href: "/admin/users",
								icon: <UsersIcon className="size-4 opacity-50" />,
							},
						],
					},
				]}
			/>

			{children}
		</>
	);
}
