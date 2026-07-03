import { getSession } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { TaskList } from "@tasks/components/TaskList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("tasks");
	return {
		title: t("title"),
	};
}

export default async function TasksPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("tasks");

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("subtitle")} />
			<TaskList />
		</>
	);
}
