"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { Spinner } from "@repo/ui/components/spinner";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const PLACEHOLDER = `e.g. AI and tech, the industry you work in, your city or country, markets and investing. Less celebrity gossip and sport.`;

interface NewsFeed {
	source: string;
	url: string;
	category?: string;
}

function sameFeedSet(a: NewsFeed[], b: NewsFeed[]): boolean {
	return a.length === b.length && a.every((f, i) => f.url === b[i].url);
}

export function BriefingSettingsSheet({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent className="gap-0 sm:max-w-lg flex w-full flex-col overflow-y-auto">
				{open && <Body onDone={() => setOpen(false)} />}
			</SheetContent>
		</Sheet>
	);
}

function Body({ onDone }: { onDone: () => void }) {
	const t = useTranslations("briefing.settings");
	const queryClient = useQueryClient();
	const profileQuery = useQuery(orpc.ai.profile.get.queryOptions());

	const [interests, setInterests] = useState("");
	const [feeds, setFeeds] = useState<NewsFeed[]>([]);
	const [newName, setNewName] = useState("");
	const [newUrl, setNewUrl] = useState("");
	const [hydrated, setHydrated] = useState(false);

	const defaultFeeds: NewsFeed[] = profileQuery.data?.defaultNewsFeeds ?? [];

	useEffect(() => {
		if (profileQuery.data && !hydrated) {
			setInterests(profileQuery.data.interests ?? "");
			// [] = following the curated defaults; start the editor from those.
			setFeeds(
				profileQuery.data.newsFeeds?.length
					? profileQuery.data.newsFeeds
					: (profileQuery.data.defaultNewsFeeds ?? []),
			);
			setHydrated(true);
		}
	}, [profileQuery.data, hydrated]);

	const addFeed = () => {
		const source = newName.trim();
		const url = newUrl.trim();
		if (!source || !url) return;
		if (!/^https?:\/\//i.test(url)) {
			toastError(t("sources.invalidUrl"));
			return;
		}
		if (feeds.some((f) => f.url === url)) return;
		setFeeds([...feeds, { source, url }]);
		setNewName("");
		setNewUrl("");
	};

	const save = useMutation(
		orpc.ai.profile.updateInterests.mutationOptions({
			onSuccess: () => {
				toastSuccess(t("saved"));
				// Interests changed → server cleared today's paper; refetch regenerates it.
				void queryClient.invalidateQueries({ queryKey: orpc.ai.profile.get.queryKey() });
				void queryClient.invalidateQueries({ queryKey: orpc.ai.briefing.queryKey() });
				onDone();
			},
			onError: () => toastError(t("error")),
		}),
	);

	const testNotif = useMutation(
		orpc.ai.briefingTestNotification.mutationOptions({
			onSuccess: () => toastSuccess(t("testSent")),
			onError: () => toastError(t("testError")),
		}),
	);

	return (
		<>
			<SheetHeader>
				<SheetTitle>{t("title")}</SheetTitle>
				<SheetDescription>
					{t("description", { name: profileQuery.data?.name ?? "Tophe" })}
				</SheetDescription>
			</SheetHeader>

			<div className="px-4 py-5 gap-3 flex flex-1 flex-col">
				{profileQuery.isLoading ? (
					<div className="py-10 flex justify-center">
						<Spinner />
					</div>
				) : (
					<Textarea
						value={interests}
						onChange={(e) => setInterests(e.target.value)}
						placeholder={PLACEHOLDER}
						rows={12}
						className="resize-none"
					/>
				)}
				<p className="text-sm text-brand-ink/55">{t("hint")}</p>

				{!profileQuery.isLoading && (
					<div className="mt-4 gap-2 pt-4 flex flex-col border-t border-brand-ink/10">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{t("sources.title")}</p>
							{!sameFeedSet(feeds, defaultFeeds) && (
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setFeeds(defaultFeeds)}
								>
									{t("sources.reset")}
								</Button>
							)}
						</div>
						<p className="text-sm text-brand-ink/55">{t("sources.hint")}</p>
						<ul className="gap-1 flex flex-col">
							{feeds.map((feed) => (
								<li
									key={feed.url}
									className="gap-2 rounded-md border border-brand-ink/10 py-1.5 pr-1 pl-3 flex items-center text-sm"
								>
									<span className="shrink-0 font-medium">{feed.source}</span>
									<span className="min-w-0 flex-1 truncate text-brand-ink/50">
										{feed.url}
									</span>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 shrink-0"
										aria-label={t("sources.remove", { name: feed.source })}
										onClick={() =>
											setFeeds(feeds.filter((f) => f.url !== feed.url))
										}
									>
										<XIcon className="size-3.5" />
									</Button>
								</li>
							))}
						</ul>
						{feeds.length === 0 && (
							<p className="text-sm text-brand-ink/55">{t("sources.empty")}</p>
						)}
						{feeds.length < 20 && (
							<div className="gap-2 flex items-center">
								<Input
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder={t("sources.namePlaceholder")}
									className="h-9 w-32 shrink-0"
								/>
								<Input
									value={newUrl}
									onChange={(e) => setNewUrl(e.target.value)}
									placeholder={t("sources.urlPlaceholder")}
									className="h-9 min-w-0 flex-1"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addFeed();
										}
									}}
								/>
								<Button
									variant="outline"
									size="sm"
									className="shrink-0"
									onClick={addFeed}
									disabled={!newName.trim() || !newUrl.trim()}
								>
									{t("sources.add")}
								</Button>
							</div>
						)}
					</div>
				)}

				<div className="mt-4 gap-2 pt-4 flex flex-col border-t border-brand-ink/10">
					<p className="text-sm font-medium">{t("testTitle")}</p>
					<p className="text-sm text-brand-ink/55">{t("testHint")}</p>
					<Button
						variant="outline"
						className="w-fit"
						onClick={() => testNotif.mutate({})}
						disabled={testNotif.isPending}
					>
						{testNotif.isPending && <Spinner className="size-4" />}
						{t("testButton")}
					</Button>
				</div>
			</div>

			<SheetFooter>
				<Button
					onClick={() =>
						save.mutate({
							interests,
							// Saving the untouched default set stores [] instead, so the
							// selection keeps following curated-list updates.
							newsFeeds: sameFeedSet(feeds, defaultFeeds) ? [] : feeds,
						})
					}
					disabled={save.isPending || profileQuery.isLoading}
				>
					{save.isPending && <Spinner className="size-4" />}
					{t("save")}
				</Button>
			</SheetFooter>
		</>
	);
}
