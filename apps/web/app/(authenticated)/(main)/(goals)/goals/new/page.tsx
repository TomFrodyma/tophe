import { getSession } from "@auth/lib/server";
import { GoalForm } from "@goals/components/GoalForm";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("goals");
	return {
		title: t("new.title"),
	};
}

export default async function NewGoalPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("goals");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("new.title")} subtitle={t("new.subtitle")} />
			<GoalForm mode="create" />
		</div>
	);
}
