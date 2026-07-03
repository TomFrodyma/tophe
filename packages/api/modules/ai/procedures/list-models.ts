import { getChatModels, getDefaultChatModelId } from "@repo/ai";

import { protectedProcedure } from "../../../orpc/procedures";

// Which models exist is an env decision per deployment (Anthropic key, local
// server, or both), so the client asks instead of hardcoding a list.
export const listModels = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/models",
		tags: ["AI"],
		summary: "List the chat models this deployment has configured",
	})
	.handler(async () => {
		const [models, defaultId] = await Promise.all([getChatModels(), getDefaultChatModelId()]);
		return {
			models: models.map(({ id, label, provider, hint }) => ({ id, label, provider, hint })),
			defaultId: defaultId || null,
		};
	});
