"use client";

import { useAgentName } from "@ai/hooks/use-agent-name";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { SettingsItem } from "@shared/components/SettingsItem";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type ModuleId = "chatbot" | "journal" | "goals" | "tasks" | "notes" | "career" | "wishlist";

// Mirrors MODULE_DEFS in NavBar.tsx (id + label only). Two spots to
// touch if the module list changes; it almost never does.
const MODULES: { id: ModuleId; labelKey: string }[] = [
	{ id: "chatbot", labelKey: "app.menu.aiChatbot" },
	{ id: "journal", labelKey: "app.menu.journal" },
	{ id: "goals", labelKey: "app.menu.goals" },
	{ id: "tasks", labelKey: "app.menu.tasks" },
	{ id: "notes", labelKey: "app.menu.notes" },
	{ id: "career", labelKey: "app.menu.career" },
	{ id: "wishlist", labelKey: "app.menu.wishlist" },
];

export function SidebarModulesForm() {
	const t = useTranslations();
	const agentName = useAgentName();
	const queryClient = useQueryClient();
	const pinnedQuery = useQuery(orpc.users.getPinnedModules.queryOptions());
	const allIds = MODULES.map((m) => m.id);
	const stored = (pinnedQuery.data?.pinnedModules ?? []).filter((id): id is ModuleId =>
		MODULES.some((m) => m.id === id),
	);
	// Empty means "all visible", so the sidebar is never left without modules.
	const visible = stored.length ? stored : allIds;

	// Optimistic, and it shares the query cache with the sidebar - flipping a
	// switch here updates the live nav at the same time.
	const setPinnedMutation = useMutation(
		orpc.users.setPinnedModules.mutationOptions({
			onMutate: async (variables) => {
				const queryKey = orpc.users.getPinnedModules.queryKey();
				await queryClient.cancelQueries({ queryKey });
				const previous = queryClient.getQueryData(queryKey);
				queryClient.setQueryData(queryKey, { pinnedModules: variables.pinnedModules });
				return { previous };
			},
			onError: (_err, _vars, context) => {
				if (context?.previous) {
					queryClient.setQueryData(orpc.users.getPinnedModules.queryKey(), context.previous);
				}
			},
			onSettled: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.users.getPinnedModules.queryKey(),
				});
			},
		}),
	);

	const toggle = (id: ModuleId, next: boolean) => {
		// Materialise the "all visible" default before removing one, so turning a
		// single module off leaves the other six on (not just that one off an empty set).
		const base = stored.length ? stored : allIds;
		const pinnedModules = next
			? Array.from(new Set([...base, id]))
			: base.filter((m) => m !== id);
		setPinnedMutation.mutate({ pinnedModules });
	};

	return (
		<SettingsItem
			title={t("settings.account.sidebar.title")}
			description={t("settings.account.sidebar.description")}
		>
			<ul className="flex flex-col gap-3">
				{MODULES.map((m) => (
					<li key={m.id} className="flex items-center justify-between gap-4">
						<Label htmlFor={`pin-${m.id}`} className="font-normal">
							{m.id === "chatbot" ? agentName : t(m.labelKey)}
						</Label>
						<Switch
							id={`pin-${m.id}`}
							checked={visible.includes(m.id)}
							onCheckedChange={(checked) => toggle(m.id, checked)}
							disabled={pinnedQuery.isLoading}
						/>
					</li>
				))}
			</ul>
		</SettingsItem>
	);
}
