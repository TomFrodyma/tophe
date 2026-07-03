import { SessionProvider } from "@auth/components/SessionProvider";
import { sessionQueryKey } from "@auth/lib/api";
import { getSession } from "@auth/lib/server";
import { agentProfileResponse } from "@repo/api/modules/ai/lib/profile-response";
import { getAgentProfileForUser, getUserPinnedModules } from "@repo/database";
import { ConfirmationAlertProvider } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { SIDEBAR_COLLAPSED_COOKIE, SidebarProvider } from "@shared/lib/sidebar-context";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthenticatedLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	// The sidebar reads this on first paint; without the prefetch it briefly
	// renders every module ("empty means show all") before shrinking to the
	// pinned set.
	await queryClient.prefetchQuery({
		queryKey: orpc.users.getPinnedModules.queryKey(),
		queryFn: async () => ({ pinnedModules: await getUserPinnedModules(session.user.id) }),
	});

	// Same deal for the agent's name in the sidebar: without the prefetch it
	// flashes the default name until the profile query resolves.
	await queryClient.prefetchQuery({
		queryKey: orpc.ai.profile.get.queryKey(),
		queryFn: async () =>
			agentProfileResponse(await getAgentProfileForUser(session.user.id)),
	});

	const initialSidebarCollapsed =
		(await cookies()).get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider>
				<ConfirmationAlertProvider>
					<SidebarProvider initialCollapsed={initialSidebarCollapsed}>
						{children}
					</SidebarProvider>
				</ConfirmationAlertProvider>
			</SessionProvider>
		</HydrationBoundary>
	);
}
