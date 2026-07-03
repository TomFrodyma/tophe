"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Spinner } from "@repo/ui/components/spinner";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { cn } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	LinkIcon,
	RefreshCwIcon,
	Trash2Icon,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useState } from "react";

export function OutlookIntegrationForm() {
	const t = useTranslations("calendar.integrations");
	const format = useFormatter();
	const now = useNow();
	const queryClient = useQueryClient();
	const [urlValue, setUrlValue] = useState("");
	const [confirmRemove, setConfirmRemove] = useState(false);

	const integrationQuery = useQuery(orpc.calendar.integrations.get.queryOptions());
	const integration = integrationQuery.data;

	const upsertMutation = useMutation(orpc.calendar.integrations.upsert.mutationOptions());
	const syncMutation = useMutation(orpc.calendar.integrations.sync.mutationOptions());
	const deleteMutation = useMutation(orpc.calendar.integrations.delete.mutationOptions());

	async function refreshIntegration() {
		await queryClient.invalidateQueries({
			queryKey: orpc.calendar.integrations.get.queryKey(),
		});
	}

	async function invalidateEvents() {
		await queryClient.invalidateQueries({
			queryKey: orpc.calendar.list.key(),
		});
	}

	async function handleSave() {
		const trimmed = urlValue.trim();
		if (!trimmed) return;
		try {
			await upsertMutation.mutateAsync({ url: trimmed });
			toastSuccess(t("notifications.saved"));
			setUrlValue("");
			await refreshIntegration();
			await handleSync(true);
		} catch (err) {
			toastError(err instanceof Error ? err.message : t("notifications.saveError"));
		}
	}

	async function handleSync(silent = false) {
		try {
			const res = await syncMutation.mutateAsync({});
			if (!silent) {
				toastSuccess(t("notifications.synced", { count: res.eventCount }));
			}
			await refreshIntegration();
			await invalidateEvents();
		} catch (err) {
			toastError(err instanceof Error ? err.message : t("notifications.syncError"));
			await refreshIntegration();
		}
	}

	async function handleDelete() {
		try {
			await deleteMutation.mutateAsync({});
			toastSuccess(t("notifications.removed"));
			setConfirmRemove(false);
			await refreshIntegration();
			await invalidateEvents();
		} catch {
			toastError(t("notifications.removeError"));
		}
	}

	const isConfigured = Boolean(integration);
	const statusOk = integration?.lastSyncStatus === "ok";
	const statusError = integration?.lastSyncStatus === "error";
	const isSyncing = syncMutation.isPending;
	const isSaving = upsertMutation.isPending;
	const isDeleting = deleteMutation.isPending;

	return (
		<SettingsItem
			title={t("outlook.title")}
			description={t("outlook.description")}
		>
			{integrationQuery.isLoading ? (
				<div className="py-8 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : !isConfigured ? (
				<div className="gap-3 flex flex-col">
					<label htmlFor="outlook-url" className="text-sm font-medium">
						{t("outlook.urlLabel")}
					</label>
					<Input
						id="outlook-url"
						type="url"
						placeholder="https://outlook.office365.com/owa/calendar/.../calendar.ics"
						value={urlValue}
						onChange={(e) => setUrlValue(e.target.value)}
						autoComplete="off"
						spellCheck={false}
					/>
					<p className="text-xs text-muted-foreground">{t("outlook.urlHint")}</p>
					<div className="gap-2 flex">
						<Button
							onClick={handleSave}
							loading={isSaving || isSyncing}
							disabled={!urlValue.trim() || isSaving}
						>
							<LinkIcon className="size-4" />
							{t("outlook.connect")}
						</Button>
					</div>
				</div>
			) : (
				<div className="gap-4 flex flex-col">
					<div className="gap-1.5 flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							{t("outlook.currentUrl")}
						</span>
						<code className="px-2 py-1 text-xs rounded bg-muted font-mono">
							{integration?.maskedUrl}
						</code>
					</div>

					<div className="gap-1.5 flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							{t("outlook.status")}
						</span>
						<div
							className={cn(
								"gap-2 flex items-center text-sm",
								statusError && "text-destructive",
								statusOk && "text-emerald-600 dark:text-emerald-400",
							)}
						>
							{statusOk && <CheckCircle2Icon className="size-4" />}
							{statusError && <AlertTriangleIcon className="size-4" />}
							<span>
								{statusOk &&
									integration?.lastSyncedAt &&
									t("outlook.statusOk", {
										when: format.relativeTime(new Date(integration.lastSyncedAt), now),
										count: integration?.eventCount ?? 0,
									})}
								{statusError && (integration?.lastSyncError ?? t("outlook.statusUnknownError"))}
								{!statusOk && !statusError && t("outlook.statusNeverSynced")}
							</span>
						</div>
					</div>

					<div className="gap-2 flex flex-wrap">
						<Button
							variant="secondary"
							onClick={() => handleSync()}
							loading={isSyncing}
							disabled={isSyncing}
						>
							<RefreshCwIcon className="size-4" />
							{t("outlook.syncNow")}
						</Button>
						{confirmRemove ? (
							<>
								<Button
									variant="ghost"
									onClick={() => setConfirmRemove(false)}
									disabled={isDeleting}
								>
									{t("outlook.cancel")}
								</Button>
								<Button
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={handleDelete}
									loading={isDeleting}
									disabled={isDeleting}
								>
									{t("outlook.confirmRemove")}
								</Button>
							</>
						) : (
							<Button
								variant="ghost"
								className="text-destructive hover:text-destructive"
								onClick={() => setConfirmRemove(true)}
							>
								<Trash2Icon className="size-4" />
								{t("outlook.disconnect")}
							</Button>
						)}
					</div>

					<div className="gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
						<p>{t("outlook.keyNote")}</p>
					</div>
				</div>
			)}
		</SettingsItem>
	);
}
