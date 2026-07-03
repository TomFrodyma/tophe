"use client";

import { Button } from "@repo/ui/components/button";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function TodayEntryButton() {
	const t = useTranslations("journal");
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation(
		orpc.journal.upsertToday.mutationOptions({
			onSuccess: async ({ id }) => {
				await queryClient.invalidateQueries({
					queryKey: orpc.journal.list.queryKey({ input: {} }),
				});
				router.push(`/journal/${id}/edit`);
			},
			onError: () => {
				toastError(t("notifications.saveError"));
			},
		}),
	);

	return (
		<Button
			variant="primary"
			loading={mutation.isPending}
			disabled={mutation.isPending}
			onClick={() => {
				mutation.mutate({ title: t("today.title") });
			}}
		>
			<CalendarCheckIcon className="size-4" />
			{t("today.cta")}
		</Button>
	);
}
