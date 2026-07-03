import { getSession } from "@auth/lib/server";
import { CalendarPage } from "@calendar/components/CalendarPage";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("calendar");
	return {
		title: t("title"),
	};
}

export default async function CalendarRoute() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("calendar");

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("subtitle")} className="mb-6" />
			<CalendarPage />
		</>
	);
}
