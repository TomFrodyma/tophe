import type { getAgentProfileForUser } from "@repo/database";

import { DEFAULT_AGENT_NAME, DEFAULT_CORE_PROFILE, DEFAULT_PERSONA } from "./agent-prompt";
import { FEEDS } from "./feeds";
import { parseStoredNewsFeeds } from "./news-feeds";

type AgentProfileRow = Awaited<ReturnType<typeof getAgentProfileForUser>>;

// The one place that shapes the ai.profile.get response - the authenticated
// layout prefetches the same query server-side and must stay in lockstep.
export function agentProfileResponse(profile: AgentProfileRow) {
	return {
		name: profile?.name ?? DEFAULT_AGENT_NAME,
		personaPrompt: profile?.personaPrompt ?? DEFAULT_PERSONA,
		coreProfile: profile?.coreProfile ?? DEFAULT_CORE_PROFILE,
		interests: profile?.interests ?? "",
		// [] = following the curated defaults (shown so the editor can start from them).
		newsFeeds: parseStoredNewsFeeds(profile?.newsFeeds),
		defaultNewsFeeds: FEEDS,
		isDefault: !profile,
	};
}
