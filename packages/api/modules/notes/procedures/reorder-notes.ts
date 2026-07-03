import { reorderNotePins } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const reorderNotesProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/notes/reorder",
		tags: ["Notes"],
		summary: "Set the manual order of pinned notes",
	})
	.input(
		z.object({
			ids: z.array(z.string()).min(1).max(500),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await reorderNotePins(user.id, input.ids);
		return { ok: true as const };
	});
