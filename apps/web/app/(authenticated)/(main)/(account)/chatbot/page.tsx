import { AiChat } from "@ai/components/AiChat";
import { getSession } from "@auth/lib/server";
import { DEFAULT_AGENT_NAME } from "@repo/api/modules/ai/lib/agent-prompt";
import { getAgentProfileForUser } from "@repo/database";

export async function generateMetadata() {
	const session = await getSession();
	const profile = session ? await getAgentProfileForUser(session.user.id) : null;
	return { title: profile?.name ?? DEFAULT_AGENT_NAME };
}

export default function AgentPage() {
	return <AiChat />;
}
