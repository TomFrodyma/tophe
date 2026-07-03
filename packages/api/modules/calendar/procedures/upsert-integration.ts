import { upsertCalendarIntegration } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { encryptSecret } from "../lib/crypto";
import { assertHttpsUrl } from "../lib/ics-sync";

export const upsertIntegration = protectedProcedure
	.route({
		method: "POST",
		path: "/calendar/integrations/outlook",
		tags: ["Calendar"],
		summary: "Save or replace the Outlook ICS URL",
	})
	.input(
		z.object({
			url: z.string().min(20).max(2048),
		}),
	)
	.handler(async ({ input: { url }, context: { user } }) => {
		try {
			assertHttpsUrl(url);
		} catch (err) {
			throw new ORPCError("BAD_REQUEST", {
				message: err instanceof Error ? err.message : "Invalid URL",
			});
		}
		const encrypted = encryptSecret(url);
		const integration = await upsertCalendarIntegration({
			userId: user.id,
			provider: "OUTLOOK_ICS",
			encryptedUrl: encrypted.ciphertext,
			nonce: encrypted.nonce,
			authTag: encrypted.authTag,
		});
		return { id: integration.id };
	});
