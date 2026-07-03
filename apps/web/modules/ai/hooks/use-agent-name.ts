"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

/**
 * The user-chosen agent name from the profile. Falls back to the default
 * while the (cached, deduped) profile query loads.
 */
export function useAgentName(): string {
	const { data } = useQuery(orpc.ai.profile.get.queryOptions());
	return data?.name ?? "Tophe";
}
