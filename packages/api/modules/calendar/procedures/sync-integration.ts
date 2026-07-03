import {
	getCalendarIntegration,
	replaceSyncedEvents,
	updateIntegrationSyncStatus,
} from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { decryptSecret } from "../lib/crypto";
import { fetchAndParseIcs, IcsSyncError, sanitizeSyncError } from "../lib/ics-sync";

export const syncIntegration = protectedProcedure
	.route({
		method: "POST",
		path: "/calendar/integrations/outlook/sync",
		tags: ["Calendar"],
		summary: "Fetch the latest events from the configured Outlook feed",
	})
	.handler(async ({ context: { user } }) => {
		const integration = await getCalendarIntegration(user.id, "OUTLOOK_ICS");
		if (!integration) {
			throw new ORPCError("NOT_FOUND", { message: "No Outlook integration configured" });
		}

		let url: string;
		try {
			url = decryptSecret({
				ciphertext: integration.encryptedUrl,
				nonce: integration.nonce,
				authTag: integration.authTag,
			});
		} catch {
			await updateIntegrationSyncStatus({
				integrationId: integration.id,
				status: "error",
				error:
					"Stored URL could not be decrypted. The encryption key may have changed; please reconnect.",
			});
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message:
					"Stored URL could not be decrypted. Remove and re-add the integration to reconnect.",
			});
		}

		try {
			const events = await fetchAndParseIcs(url);
			const eventCount = await replaceSyncedEvents({
				integrationId: integration.id,
				userId: user.id,
				events,
			});
			await updateIntegrationSyncStatus({
				integrationId: integration.id,
				status: "ok",
				error: null,
				eventCount,
			});
			return {
				ok: true as const,
				eventCount,
				syncedAt: new Date(),
			};
		} catch (err) {
			const raw = err instanceof Error ? err.message : "Sync failed";
			const safe = sanitizeSyncError(url, raw);
			await updateIntegrationSyncStatus({
				integrationId: integration.id,
				status: "error",
				error: safe,
			});
			if (err instanceof IcsSyncError) {
				throw new ORPCError("BAD_REQUEST", { message: safe });
			}
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: safe });
		}
	});
