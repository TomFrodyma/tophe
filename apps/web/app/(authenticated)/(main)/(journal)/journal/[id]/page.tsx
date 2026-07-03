import { getSession } from "@auth/lib/server";
import { JournalEntryActions } from "@journal/components/JournalEntryActions";
import { isJournalMood, MOOD_EMOJI } from "@journal/lib/moods";
import { getJournalEntryForUser } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ArrowLeftIcon } from "lucide-react";
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
	const entry = await getJournalEntryForUser(id, session.user.id);
	return { title: entry?.title };
}

export default async function JournalEntryPage({ params }: PageProps) {
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
	const format = await getFormatter();
	const mood = isJournalMood(entry.mood) ? entry.mood : null;

	return (
		<div className="max-w-3xl">
			<div className="mb-6">
				<Button asChild variant="ghost" size="sm">
					<Link href="/journal">
						<ArrowLeftIcon className="size-4" />
						{t("entry.back")}
					</Link>
				</Button>
			</div>

			<Card className="gap-4 p-8 flex flex-col">
				<div className="gap-4 flex flex-wrap items-start justify-between">
					<div>
						<h1 className="font-semibold text-2xl lg:text-3xl">{entry.title}</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{format.dateTime(new Date(entry.createdAt), {
								dateStyle: "full",
								timeStyle: "short",
							})}
						</p>
					</div>
					{mood && (
						<div className="gap-2 flex items-center">
							<span className="text-3xl" aria-hidden>
								{MOOD_EMOJI[mood]}
							</span>
							<span className="text-sm text-muted-foreground">
								{t(`moods.${mood}`)}
							</span>
						</div>
					)}
				</div>

				<div className="whitespace-pre-wrap text-base leading-relaxed">{entry.content}</div>

				<div className="mt-4 border-t pt-4">
					<JournalEntryActions entryId={entry.id} />
				</div>
			</Card>
		</div>
	);
}
