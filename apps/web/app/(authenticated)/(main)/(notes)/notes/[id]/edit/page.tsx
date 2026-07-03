import { getSession } from "@auth/lib/server";
import { NoteForm } from "@notes/components/NoteForm";
import { getNoteForUser } from "@repo/database";
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
	const note = await getNoteForUser(id, session.user.id);
	return { title: note?.title };
}

export default async function EditNotePage({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { id } = await params;
	const note = await getNoteForUser(id, session.user.id);
	if (!note) {
		notFound();
	}

	const t = await getTranslations("notes");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("edit.title")} subtitle={t("edit.subtitle")} />
			<NoteForm
				mode="edit"
				note={{
					id: note.id,
					title: note.title,
					content: note.content,
					remindAt: note.remindAt,
				}}
			/>
		</div>
	);
}
