import { getSession } from "@auth/lib/server";
import { JournalList } from "@journal/components/JournalList";
import { JournalSummaryPanel } from "@journal/components/JournalSummaryPanel";
import { TodayEntryButton } from "@journal/components/TodayEntryButton";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("journal");
	return {
		title: t("title"),
	};
}

export default async function JournalPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("journal");

	return (
		<>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					<>
						<Button asChild variant="secondary">
							<Link href="/journal/new">
								<PlusIcon className="size-4" />
								{t("actions.new")}
							</Link>
						</Button>
						<TodayEntryButton />
					</>
				}
			/>

			<div className="gap-6 flex flex-col">
				<JournalSummaryPanel />
				<JournalList />
			</div>
		</>
	);
}
