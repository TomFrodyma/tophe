"use client";

import { Button } from "@repo/ui/components/button";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface JournalEntryActionsProps {
	entryId: string;
}

export function JournalEntryActions({ entryId }: JournalEntryActionsProps) {
	const t = useTranslations("journal");
	const router = useRouter();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();

	const deleteMutation = useMutation(
		orpc.journal.delete.mutationOptions({
			onSuccess: async () => {
				toastSuccess(t("notifications.deleted"));
				await queryClient.invalidateQueries({
					queryKey: orpc.journal.list.queryKey({ input: {} }),
				});
				router.push("/journal");
			},
			onError: () => {
				toastError(t("notifications.deleteError"));
			},
		}),
	);

	return (
		<div className="gap-2 flex">
			<Button
				variant="secondary"
				size="sm"
				onClick={() => router.push(`/journal/${entryId}/edit`)}
			>
				<PencilIcon className="size-4" />
				{t("entry.edit")}
			</Button>
			<Button
				variant="destructive"
				size="sm"
				onClick={() =>
					confirm({
						title: t("entry.deleteConfirm.title"),
						message: t("entry.deleteConfirm.message"),
						destructive: true,
						confirmLabel: t("entry.deleteConfirm.confirm"),
						onConfirm: async () => {
							await deleteMutation.mutateAsync({ id: entryId });
						},
					})
				}
			>
				<Trash2Icon className="size-4" />
				{t("entry.delete")}
			</Button>
		</div>
	);
}
