"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().max(50_000),
	remindAt: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface NoteFormProps {
	mode: "create" | "edit";
	note?: {
		id: string;
		title: string;
		content: string;
		remindAt: Date | string | null;
	};
}

function toLocalInputValue(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => `${n}`.padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function NoteForm({ mode, note }: NoteFormProps) {
	const t = useTranslations("notes");
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: note?.title ?? "",
			content: note?.content ?? "",
			remindAt: toLocalInputValue(note?.remindAt ?? null),
		},
	});

	const createMutation = useMutation(orpc.notes.create.mutationOptions());
	const updateMutation = useMutation(orpc.notes.update.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		const remindAt = fromLocalInputValue(values.remindAt);

		try {
			if (mode === "create") {
				const created = await createMutation.mutateAsync({
					title: values.title,
					content: values.content,
					remindAt,
				});
				toastSuccess(t("notifications.created"));
				await queryClient.invalidateQueries({
					queryKey: orpc.notes.list.queryKey({ input: {} }),
				});
				router.push(`/notes/${created.id}`);
			} else if (note) {
				await updateMutation.mutateAsync({
					id: note.id,
					title: values.title,
					content: values.content,
					remindAt,
				});
				toastSuccess(t("notifications.updated"));
				await queryClient.invalidateQueries({
					queryKey: orpc.notes.list.queryKey({ input: {} }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.notes.get.queryKey({ input: { id: note.id } }),
				});
				router.push(`/notes/${note.id}`);
			}
		} catch (_error) {
			toastError(t("notifications.saveError"));
		}
	});

	const isSubmitting = createMutation.isPending || updateMutation.isPending;
	const remindAtValue = form.watch("remindAt");

	return (
		<form onSubmit={onSubmit} className="gap-6 flex flex-col">
			<div className="gap-2 flex flex-col">
				<label htmlFor="note-title" className="font-medium text-sm">
					{t("form.title")}
				</label>
				<Input
					id="note-title"
					type="text"
					placeholder={t("form.titlePlaceholder")}
					{...form.register("title")}
				/>
				{form.formState.errors.title && (
					<p className="text-destructive text-sm">{t("form.titleRequired")}</p>
				)}
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="note-content" className="font-medium text-sm">
					{t("form.content")}
				</label>
				<Textarea
					id="note-content"
					rows={10}
					placeholder={t("form.contentPlaceholder")}
					{...form.register("content")}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="note-remind-at" className="font-medium text-sm">
					{t("form.remindAt")}
				</label>
				<div className="gap-2 flex items-center">
					<Input
						id="note-remind-at"
						type="datetime-local"
						className="max-w-sm"
						{...form.register("remindAt")}
					/>
					{remindAtValue && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() =>
								form.setValue("remindAt", "", { shouldDirty: true })
							}
						>
							{t("form.clearReminder")}
						</Button>
					)}
				</div>
				<p className="text-xs text-muted-foreground">{t("form.remindAtHint")}</p>
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
