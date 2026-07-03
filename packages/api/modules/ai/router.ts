import { clearMemories } from "./procedures/clear-memories";
import { deleteConversation } from "./procedures/delete-conversation";
import { deleteMemory } from "./procedures/delete-memory";
import { getConversation } from "./procedures/get-conversation";
import { getDailyBriefing } from "./procedures/get-daily-briefing";
import { getProfile } from "./procedures/get-profile";
import { getStartGreeting } from "./procedures/get-start-greeting";
import { listConversations } from "./procedures/list-conversations";
import { listMemories } from "./procedures/list-memories";
import { listModels } from "./procedures/list-models";
import { regenerateBriefing } from "./procedures/regenerate-briefing";
import { sendBriefingTest } from "./procedures/send-briefing-test";
import { streamMessage } from "./procedures/stream-message";
import { updateInterests } from "./procedures/update-interests";
import { updateProfile } from "./procedures/update-profile";

export const aiRouter = {
	stream: streamMessage,
	models: listModels,
	greeting: getStartGreeting,
	briefing: getDailyBriefing,
	briefingRegenerate: regenerateBriefing,
	briefingTestNotification: sendBriefingTest,
	profile: {
		get: getProfile,
		update: updateProfile,
		updateInterests,
	},
	memories: {
		list: listMemories,
		delete: deleteMemory,
		clear: clearMemories,
	},
	conversations: {
		list: listConversations,
		get: getConversation,
		delete: deleteConversation,
	},
};
