import { getSession } from "@auth/lib/server";
import { GoalDetail } from "@goals/components/GoalDetail";
import { getGoalForUser } from "@repo/database";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		return {};
	}
	const { id } = await params;
	const goal = await getGoalForUser(id, session.user.id);
	return { title: goal?.title };
}

export default async function GoalDetailPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { id } = await params;
	const goal = await getGoalForUser(id, session.user.id);
	if (!goal) {
		notFound();
	}

	return (
		<div className="max-w-3xl">
			<GoalDetail goalId={id} />
		</div>
	);
}
