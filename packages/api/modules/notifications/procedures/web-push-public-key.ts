import { getWebPushPublicKey } from "@repo/notifications";

import { protectedProcedure } from "../../../orpc/procedures";

/** The VAPID public key browsers subscribe with. Auto-generated server-side on
 *  first call, so Web Push needs zero configuration. */
export const webPushPublicKey = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/web-push/public-key",
		tags: ["Notifications"],
		summary: "Get the Web Push application server key",
	})
	.handler(async () => {
		return { publicKey: await getWebPushPublicKey() };
	});
