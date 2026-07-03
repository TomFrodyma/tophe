import { getSession } from "@auth/lib/server";
import { NoteForm } from "@notes/components/NoteForm";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("notes");
	return {
		title: t("new.title"),
	};
}

export default async function NewNotePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("notes");

	return (
		<div className="max-w-2xl">
			<PageHeader title={t("new.title")} subtitle={t("new.subtitle")} />
			<NoteForm mode="create" />
		</div>
	);
}
