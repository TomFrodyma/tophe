"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { DragHandle } from "@shared/components/sortable";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import {
	isWishlistPriority,
	PRIORITY_META,
	PRIORITY_ORDER,
	type WishlistItemLite,
	type WishlistPriority,
} from "../lib/constants";

interface WishlistRowProps {
	item: WishlistItemLite;
	/** Show a drag handle and register with the surrounding SortableContext. */
	sortable?: boolean;
}

function formatPrice(
	format: ReturnType<typeof useFormatter>,
	price: number | null,
	currency: string | null,
): string | null {
	if (price == null) return null;
	if (currency) {
		try {
			return format.number(price, { style: "currency", currency });
		} catch {
			return `${format.number(price)} ${currency}`;
		}
	}
	return format.number(price);
}

export function WishlistRow({ item, sortable = false }: WishlistRowProps) {
	const t = useTranslations("wishlist");
	const format = useFormatter();
	const queryClient = useQueryClient();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
		disabled: !sortable,
	});
	const [expanded, setExpanded] = useState(false);
	const [titleDraft, setTitleDraft] = useState(item.title);
	const [notesDraft, setNotesDraft] = useState(item.notes ?? "");
	const [urlDraft, setUrlDraft] = useState(item.url ?? "");
	const [priceDraft, setPriceDraft] = useState(item.price != null ? String(item.price) : "");
	const [currencyDraft, setCurrencyDraft] = useState(item.currency ?? "");
	const [priorityDraft, setPriorityDraft] = useState<WishlistPriority>(
		isWishlistPriority(item.priority) ? item.priority : "WANT",
	);

	const invalidate = async () => {
		await queryClient.invalidateQueries({
			queryKey: orpc.wishlist.list.queryKey({ input: {} }),
		});
	};

	const updateMutation = useMutation(
		orpc.wishlist.update.mutationOptions({
			onSuccess: invalidate,
			onError: () => toastError(t("notifications.saveError")),
		}),
	);

	const deleteMutation = useMutation(
		orpc.wishlist.delete.mutationOptions({
			onSuccess: invalidate,
			onError: () => toastError(t("notifications.deleteError")),
		}),
	);

	const isPurchased = item.status === "PURCHASED";

	const togglePurchased = () => {
		updateMutation.mutate({
			id: item.id,
			status: isPurchased ? "WANTED" : "PURCHASED",
		});
	};

	const saveEdits = () => {
		const trimmed = titleDraft.trim();
		if (!trimmed) {
			setTitleDraft(item.title);
			return;
		}
		const parsedPrice = priceDraft.trim() ? Number(priceDraft) : null;
		if (parsedPrice != null && !Number.isFinite(parsedPrice)) {
			toastError(t("notifications.saveError"));
			return;
		}
		updateMutation.mutate({
			id: item.id,
			title: trimmed,
			notes: notesDraft.trim() || null,
			url: urlDraft.trim() || null,
			price: parsedPrice,
			currency: currencyDraft.trim() || null,
			priority: priorityDraft,
		});
		setExpanded(false);
	};

	const cancelEdits = () => {
		setTitleDraft(item.title);
		setNotesDraft(item.notes ?? "");
		setUrlDraft(item.url ?? "");
		setPriceDraft(item.price != null ? String(item.price) : "");
		setCurrencyDraft(item.currency ?? "");
		setPriorityDraft(isWishlistPriority(item.priority) ? item.priority : "WANT");
		setExpanded(false);
	};

	const priceLabel = formatPrice(format, item.price, item.currency);

	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn("rounded-lg border bg-card", isDragging && "relative z-10 opacity-80")}
		>
			<div className="gap-3 p-3 flex items-center">
				{sortable && (
					<DragHandle
						label={t("row.reorder")}
						className="-ml-1"
						{...attributes}
						{...listeners}
					/>
				)}
				<button
					type="button"
					aria-label={t(isPurchased ? "row.markWanted" : "row.markPurchased")}
					aria-pressed={isPurchased}
					onClick={togglePurchased}
					className={cn(
						"size-5 rounded flex shrink-0 items-center justify-center border-2 transition-colors",
						isPurchased
							? "border-primary bg-primary text-primary-foreground"
							: "border-muted-foreground/40 hover:border-foreground",
					)}
				>
					{isPurchased && <CheckIcon className="size-3" />}
				</button>

				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="min-w-0 gap-0.5 flex flex-1 flex-col text-left"
				>
					<span
						className={cn(
							"text-sm truncate",
							isPurchased && "text-muted-foreground line-through",
						)}
					>
						{item.title}
					</span>
					{priceLabel && (
						<span className="text-xs text-muted-foreground">{priceLabel}</span>
					)}
				</button>

				{item.url && (
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						aria-label={t("row.openLink")}
						className="size-9 flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<ExternalLinkIcon className="size-4" />
					</a>
				)}

				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					onClick={() => deleteMutation.mutate({ id: item.id })}
					aria-label={t("row.delete")}
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>

			{expanded && (
				<div className="gap-3 p-3 flex flex-col border-t">
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.title")}</label>
						<Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
					</div>
					<div className="gap-3 flex flex-wrap">
						<div className="gap-1.5 flex flex-col">
							<label className="text-xs text-muted-foreground">
								{t("row.priority")}
							</label>
							<select
								value={priorityDraft}
								onChange={(e) =>
									setPriorityDraft(e.target.value as WishlistPriority)
								}
								className="h-9 px-2 text-sm rounded-md border bg-background"
							>
								{PRIORITY_ORDER.map((p) => (
									<option key={p} value={p}>
										{t(`priority.${PRIORITY_META[p].labelKey}`)}
									</option>
								))}
							</select>
						</div>
						<div className="gap-1.5 flex flex-col">
							<label className="text-xs text-muted-foreground">
								{t("row.price")}
							</label>
							<Input
								type="number"
								inputMode="decimal"
								min={0}
								step="0.01"
								value={priceDraft}
								onChange={(e) => setPriceDraft(e.target.value)}
								className="w-32"
								placeholder="0"
							/>
						</div>
						<div className="gap-1.5 flex flex-col">
							<label className="text-xs text-muted-foreground">
								{t("row.currency")}
							</label>
							<Input
								value={currencyDraft}
								onChange={(e) => setCurrencyDraft(e.target.value.toUpperCase())}
								maxLength={3}
								className="w-20 uppercase"
								placeholder="EUR"
							/>
						</div>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.url")}</label>
						<Input
							type="url"
							value={urlDraft}
							onChange={(e) => setUrlDraft(e.target.value)}
							placeholder={t("row.urlPlaceholder")}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.notes")}</label>
						<textarea
							value={notesDraft}
							onChange={(e) => setNotesDraft(e.target.value)}
							rows={3}
							className="p-2 text-sm rounded-md border bg-background"
							placeholder={t("row.notesPlaceholder")}
						/>
					</div>
					<div className="gap-2 flex justify-end">
						<Button variant="ghost" size="sm" onClick={cancelEdits}>
							{t("row.cancel")}
						</Button>
						<Button size="sm" onClick={saveEdits} loading={updateMutation.isPending}>
							{t("row.save")}
						</Button>
					</div>
				</div>
			)}
		</li>
	);
}
