import { getSession } from "@auth/lib/server";
import { GoalForm } from "@goals/components/GoalForm";
import { getGoalForUser } from "@repo/database";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata() {
	const t = await getTranslations("goals");
	return {
		title: t("edit.title"),
	};
}

export default async function EditGoalPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { id } = await params;
	const goal = await getGoalForUser(id, session.user.id);
	if (!goal) {
		notFound();
	}

	const t = await getTranslations("goals");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("edit.title")} subtitle={t("edit.subtitle")} />
			<GoalForm
				mode="edit"
				goal={{
					id: goal.id,
					title: goal.title,
					description: goal.description,
					type: goal.type,
					horizon: goal.horizon,
					targetValue: goal.targetValue,
					unit: goal.unit,
					startDate: goal.startDate,
					dueDate: goal.dueDate,
					color: goal.color,
					icon: goal.icon,
					cadence: goal.cadence,
					milestones: goal.milestones.map((m) => ({
						id: m.id,
						title: m.title,
						done: m.done,
					})),
				}}
			/>
		</div>
	);
}
