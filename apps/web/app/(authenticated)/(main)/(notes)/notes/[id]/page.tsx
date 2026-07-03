import { getSession } from "@auth/lib/server";
import { NoteActions } from "@notes/components/NoteActions";
import { getNoteForUser } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ArrowLeftIcon, BellIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
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

export default async function NotePage({ params }: PageProps) {
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
	const format = await getFormatter();
	const remindAt = note.remindAt;
	const isPast = remindAt ? remindAt.getTime() < Date.now() : false;

	return (
		<div className="max-w-3xl">
			<div className="mb-6">
				<Button asChild variant="ghost" size="sm">
					<Link href="/notes">
						<ArrowLeftIcon className="size-4" />
						{t("entry.back")}
					</Link>
				</Button>
			</div>

			<Card className="gap-4 p-8 flex flex-col">
				<div className="gap-4 flex flex-wrap items-start justify-between">
					<div>
						<h1 className="font-semibold text-2xl lg:text-3xl">{note.title}</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{format.dateTime(new Date(note.createdAt), {
								dateStyle: "full",
								timeStyle: "short",
							})}
						</p>
					</div>
					{remindAt && (
						<span
							className={
								isPast
									? "px-3 py-1.5 text-sm rounded-full bg-muted text-muted-foreground gap-1.5 inline-flex items-center"
									: "px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary gap-1.5 inline-flex items-center"
							}
						>
							<BellIcon className="size-4" />
							{format.dateTime(remindAt, {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</span>
					)}
				</div>

				{note.content.trim() && (
					<div className="whitespace-pre-wrap text-base leading-relaxed">
						{note.content}
					</div>
				)}

				<div className="mt-4 border-t pt-4">
					<NoteActions noteId={note.id} />
				</div>
			</Card>
		</div>
	);
}
