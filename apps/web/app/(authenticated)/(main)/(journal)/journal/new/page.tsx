import { getSession } from "@auth/lib/server";
import { JournalEntryForm } from "@journal/components/JournalEntryForm";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("journal");
	return {
		title: t("new.title"),
	};
}

export default async function NewJournalEntryPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("journal");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("new.title")} subtitle={t("new.subtitle")} />
			<JournalEntryForm mode="create" />
		</div>
	);
}
