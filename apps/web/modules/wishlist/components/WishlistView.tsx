"use client";

import { Card } from "@repo/ui/components/card";
import { Spinner } from "@repo/ui/components/spinner";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toastError } from "@repo/ui/components/toast";
import { SortableGroup } from "@shared/components/sortable";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GiftIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
	PRIORITY_META,
	PRIORITY_ORDER,
	type WishlistItemLite,
	type WishlistPriority,
} from "../lib/constants";
import { QuickAdd } from "./QuickAdd";
import { WishlistRow } from "./WishlistRow";

type TabKey = "WANTED" | "PURCHASED";

/** Sum prices per currency; items without a price are skipped. Items with a
 *  price but no currency are bucketed under "" (rendered without a code). */
function totalsByCurrency(items: WishlistItemLite[]): [string, number][] {
	const totals = new Map<string, number>();
	for (const item of items) {
		if (item.price == null) continue;
		const key = item.currency ?? "";
		totals.set(key, (totals.get(key) ?? 0) + item.price);
	}
	return Array.from(totals.entries());
}

export function WishlistView() {
	const t = useTranslations("wishlist");
	const format = useFormatter();
	const [tab, setTab] = useState<TabKey>("WANTED");

	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery(orpc.wishlist.list.queryOptions({ input: {} }));

	const reorderMutation = useMutation(
		orpc.wishlist.reorder.mutationOptions({
			onError: () => {
				toastError(t("notifications.saveError"));
				void queryClient.invalidateQueries({
					queryKey: orpc.wishlist.list.queryKey({ input: {} }),
				});
			},
		}),
	);

	// Optimistically reorder the cached list (the dragged group's items swap
	// places among their own slots), then persist. On failure the invalidate
	// above snaps back to the server's order.
	const applyReorder = (ids: string[]) => {
		const pos = new Map(ids.map((id, i) => [id, i]));
		queryClient.setQueryData(orpc.wishlist.list.queryKey({ input: {} }), (old) => {
			if (!old) return old;
			const moved = [...old]
				.filter((it) => pos.has(it.id))
				.sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
			let next = 0;
			return old.map((it) => (pos.has(it.id) ? moved[next++] : it));
		});
		reorderMutation.mutate({ ids });
	};

	const items = useMemo(() => (data ?? []) as WishlistItemLite[], [data]);

	const wanted = useMemo(() => items.filter((i) => i.status === "WANTED"), [items]);
	const purchased = useMemo(() => items.filter((i) => i.status === "PURCHASED"), [items]);

	const grouped = useMemo(() => {
		const map: Record<WishlistPriority, WishlistItemLite[]> = {
			NEED: [],
			WANT: [],
			SOMEDAY: [],
		};
		for (const item of wanted) {
			const p =
				(item.priority as WishlistPriority) in map
					? (item.priority as WishlistPriority)
					: "WANT";
			map[p].push(item);
		}
		return map;
	}, [wanted]);

	const formatTotals = (group: WishlistItemLite[]): string | null => {
		const totals = totalsByCurrency(group);
		if (totals.length === 0) return null;
		return totals
			.map(([currency, sum]) => {
				if (currency) {
					try {
						return format.number(sum, { style: "currency", currency });
					} catch {
						return `${format.number(sum)} ${currency}`;
					}
				}
				return format.number(sum);
			})
			.join(" · ");
	};

	const listForTab = tab === "WANTED" ? wanted : purchased;

	return (
		<div className="gap-4 flex flex-col">
			<QuickAdd />

			<Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
				<TabsList>
					<TabsTrigger value="WANTED">
						{t("tabs.wanted")}
						<span className="ml-2 text-xs text-muted-foreground">{wanted.length}</span>
					</TabsTrigger>
					<TabsTrigger value="PURCHASED">
						{t("tabs.purchased")}
						<span className="ml-2 text-xs text-muted-foreground">
							{purchased.length}
						</span>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{isLoading ? (
				<div className="py-12 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : listForTab.length === 0 ? (
				<Card className="gap-2 py-12 flex flex-col items-center text-center">
					<GiftIcon className="size-8 text-muted-foreground" />
					<p className="font-medium">
						{tab === "WANTED" ? t("empty.wantedTitle") : t("empty.purchasedTitle")}
					</p>
					<p className="max-w-md text-sm text-muted-foreground">{t("empty.hint")}</p>
				</Card>
			) : tab === "WANTED" ? (
				<div className="gap-6 flex flex-col">
					{PRIORITY_ORDER.map((priority) => {
						const group = grouped[priority];
						if (group.length === 0) return null;
						const meta = PRIORITY_META[priority];
						const totalLabel = formatTotals(group);
						return (
							<section key={priority} className="gap-2 flex flex-col">
								<div className="gap-2 px-1 flex items-center">
									<span
										className={`size-2 rounded-full ${meta.dot}`}
										aria-hidden
									/>
									<h2 className="text-sm font-semibold">
										{t(`priority.${meta.labelKey}`)}
									</h2>
									<span className="text-xs text-muted-foreground">
										{group.length}
									</span>
									{totalLabel && (
										<span className="text-xs ml-auto text-muted-foreground">
											{totalLabel}
										</span>
									)}
								</div>
								<SortableGroup
									ids={group.map((item) => item.id)}
									onReorder={applyReorder}
								>
									<ul className="gap-2 flex flex-col">
										{group.map((item) => (
											<WishlistRow key={item.id} item={item} sortable />
										))}
									</ul>
								</SortableGroup>
							</section>
						);
					})}
				</div>
			) : (
				<ul className="gap-2 flex flex-col">
					{purchased.map((item) => (
						<WishlistRow key={item.id} item={item} />
					))}
				</ul>
			)}
		</div>
	);
}
