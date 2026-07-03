import { clearAgentMemories } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";

export const clearMemories = protectedProcedure
	.route({
		method: "DELETE",
		path: "/ai/memories",
		tags: ["AI"],
		summary: "Forget everything the agent has remembered",
	})
	.handler(async ({ context: { user } }) => {
		const cleared = await clearAgentMemories(user.id);
		return { cleared };
	});
