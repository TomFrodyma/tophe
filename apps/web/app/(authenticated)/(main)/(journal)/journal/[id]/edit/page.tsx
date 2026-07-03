import { getSession } from "@auth/lib/server";
import { JournalEntryForm } from "@journal/components/JournalEntryForm";
import { getJournalEntryForUser } from "@repo/database";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
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
	const entry = await getJournalEntryForUser(id, session.user.id);
	return { title: entry?.title };
}

export default async function EditJournalEntryPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { id } = await params;
	const entry = await getJournalEntryForUser(id, session.user.id);
	if (!entry) {
		notFound();
	}

	const t = await getTranslations("journal");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("edit.title")} subtitle={t("edit.subtitle")} />
			<JournalEntryForm
				mode="edit"
				entry={{
					id: entry.id,
					title: entry.title,
					content: entry.content,
					mood: entry.mood,
					createdAt: entry.createdAt.toISOString(),
				}}
			/>
		</div>
	);
}
