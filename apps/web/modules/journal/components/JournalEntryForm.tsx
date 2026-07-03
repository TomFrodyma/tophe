"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buildCreatedAt, toDateInputValue } from "../lib/entry-date";
import { JOURNAL_MOODS, type JournalMoodValue, MOOD_EMOJI } from "../lib/moods";

const NONE_VALUE = "__none__";

const formSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1).max(50_000),
	mood: z.string().optional(),
	date: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface JournalEntryFormProps {
	mode: "create" | "edit";
	entry?: {
		id: string;
		title: string;
		content: string;
		mood: string | null;
		createdAt: string;
	};
}

export function JournalEntryForm({ mode, entry }: JournalEntryFormProps) {
	const t = useTranslations("journal");
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: entry?.title ?? "",
			content: entry?.content ?? "",
			mood: entry?.mood ?? NONE_VALUE,
			date: toDateInputValue(entry?.createdAt ? new Date(entry.createdAt) : new Date()),
		},
	});

	const createMutation = useMutation(orpc.journal.create.mutationOptions());
	const updateMutation = useMutation(orpc.journal.update.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		const mood = values.mood && values.mood !== NONE_VALUE
			? (values.mood as JournalMoodValue)
			: null;

		const date = buildCreatedAt(
			values.date,
			entry?.createdAt ? new Date(entry.createdAt) : new Date(),
		);

		try {
			if (mode === "create") {
				const created = await createMutation.mutateAsync({
					title: values.title,
					content: values.content,
					mood,
					date,
				});
				toastSuccess(t("notifications.created"));
				await queryClient.invalidateQueries({
					queryKey: orpc.journal.list.queryKey({ input: {} }),
				});
				router.push(`/journal/${created.id}`);
			} else if (entry) {
				await updateMutation.mutateAsync({
					id: entry.id,
					title: values.title,
					content: values.content,
					mood,
					date,
				});
				toastSuccess(t("notifications.updated"));
				await queryClient.invalidateQueries({
					queryKey: orpc.journal.list.queryKey({ input: {} }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.journal.get.queryKey({ input: { id: entry.id } }),
				});
				router.push(`/journal/${entry.id}`);
			}
		} catch (_error) {
			toastError(t("notifications.saveError"));
		}
	});

	const isSubmitting = createMutation.isPending || updateMutation.isPending;
	const moodValue = form.watch("mood");

	return (
		<form onSubmit={onSubmit} className="gap-6 flex flex-col">
			<div className="gap-2 flex flex-col">
				<label htmlFor="journal-title" className="font-medium text-sm">
					{t("form.title")}
				</label>
				<Input
					id="journal-title"
					type="text"
					placeholder={t("form.titlePlaceholder")}
					{...form.register("title")}
				/>
				{form.formState.errors.title && (
					<p className="text-destructive text-sm">{t("form.titleRequired")}</p>
				)}
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="journal-date" className="font-medium text-sm">
					{t("form.date")}
				</label>
				<Input
					id="journal-date"
					type="date"
					className="w-fit"
					{...form.register("date")}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="journal-mood" className="font-medium text-sm">
					{t("form.mood")}
				</label>
				<Select
					value={moodValue ?? NONE_VALUE}
					onValueChange={(v) => form.setValue("mood", v, { shouldDirty: true })}
				>
					<SelectTrigger id="journal-mood">
						<SelectValue placeholder={t("form.moodPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE_VALUE}>{t("form.moodNone")}</SelectItem>
						{JOURNAL_MOODS.map((mood) => (
							<SelectItem key={mood} value={mood}>
								<span className="mr-2">{MOOD_EMOJI[mood]}</span>
								{t(`moods.${mood}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="journal-content" className="font-medium text-sm">
					{t("form.content")}
				</label>
				<Textarea
					id="journal-content"
					rows={12}
					placeholder={t("form.contentPlaceholder")}
					{...form.register("content")}
				/>
				{form.formState.errors.content && (
					<p className="text-destructive text-sm">{t("form.contentRequired")}</p>
				)}
			</div>

			<div className="gap-2 flex justify-end">
				<Button type="button" variant="ghost" onClick={() => router.back()}>
					{t("form.cancel")}
				</Button>
				<Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
					{mode === "create" ? t("form.create") : t("form.save")}
				</Button>
			</div>
		</form>
	);
}
