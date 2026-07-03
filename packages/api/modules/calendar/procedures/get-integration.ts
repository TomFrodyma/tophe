import { getCalendarIntegration } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { decryptSecret } from "../lib/crypto";

function maskUrl(url: string): string {
	if (url.length <= 12) return "…";
	return `…${url.slice(-8)}`;
}

export const getIntegration = protectedProcedure
	.route({
		method: "GET",
		path: "/calendar/integrations/outlook",
		tags: ["Calendar"],
		summary: "Get the Outlook calendar integration for the user",
	})
	.handler(async ({ context: { user } }) => {
		const integration = await getCalendarIntegration(user.id, "OUTLOOK_ICS");
		if (!integration) return null;
		let maskedUrl = "…";
		try {
			const url = decryptSecret({
				ciphertext: integration.encryptedUrl,
				nonce: integration.nonce,
				authTag: integration.authTag,
			});
			maskedUrl = maskUrl(url);
		} catch {
			maskedUrl = "…";
		}
		return {
			id: integration.id,
			provider: integration.provider,
			maskedUrl,
			lastSyncedAt: integration.lastSyncedAt,
			lastSyncStatus: integration.lastSyncStatus,
			lastSyncError: integration.lastSyncError,
			eventCount: integration.eventCount,
			createdAt: integration.createdAt,
			updatedAt: integration.updatedAt,
		};
	});
