import { getSession } from "@auth/lib/server";
import { GoalsList } from "@goals/components/GoalsList";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("goals");
	return {
		title: t("title"),
	};
}

export default async function GoalsPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("goals");

	return (
		<>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					<Button asChild>
						<Link href="/goals/new">
							<PlusIcon className="size-4" />
							{t("actions.new")}
						</Link>
					</Button>
				}
			/>

			<GoalsList />
		</>
	);
}
