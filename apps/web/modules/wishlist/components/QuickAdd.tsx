"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PRIORITY_ORDER, type WishlistPriority } from "../lib/constants";

export function QuickAdd() {
	const t = useTranslations("wishlist");
	const queryClient = useQueryClient();
	const [title, setTitle] = useState("");
	const [priority, setPriority] = useState<WishlistPriority>("WANT");

	const createMutation = useMutation(
		orpc.wishlist.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpc.wishlist.list.queryKey({ input: {} }),
				});
			},
			onError: () => toastError(t("notifications.saveError")),
		}),
	);

	const submit = () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		createMutation.mutate({ title: trimmed, priority });
		setTitle("");
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
			className="gap-2 p-3 flex flex-wrap items-center rounded-lg border bg-card"
		>
			<PlusIcon className="size-4 text-muted-foreground shrink-0" />
			<Input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t("quickAdd.placeholder")}
				className="min-w-[150px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
			/>
			<select
				value={priority}
				onChange={(e) => setPriority(e.target.value as WishlistPriority)}
				aria-label={t("row.priority")}
				className="h-9 rounded-md border bg-background px-2 text-sm"
			>
				{PRIORITY_ORDER.map((p) => (
					<option key={p} value={p}>
						{t(`priority.${p.toLowerCase()}`)}
					</option>
				))}
			</select>
			<Button
				type="submit"
				size="sm"
				disabled={!title.trim() || createMutation.isPending}
				loading={createMutation.isPending}
			>
				{t("quickAdd.submit")}
			</Button>
		</form>
	);
}
