import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import { createFirstAdminUser } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";

/**
 * First-run account creation for a fresh install. Only works while the
 * instance has ZERO users - the moment one exists this endpoint is dead, and
 * signup stays disabled everywhere else. Standard self-hosted bootstrap
 * pattern (Grafana, Portainer, etc.). The zero-users gate and the create run
 * in one serializable transaction, so concurrent first-run requests can't both
 * land an admin.
 */
export const bootstrapFirstUser = publicProcedure
	.route({
		method: "POST",
		path: "/users/bootstrap",
		tags: ["Users"],
		summary: "Create the first account on a fresh install",
	})
	.input(
		z.object({
			name: z.string().min(1).max(100),
			email: z.email(),
			password: z.string().min(8).max(128),
		}),
	)
	.handler(async ({ input }) => {
		const authContext = await auth.$context;
		const hashedPassword = await authContext.password.hash(input.password);

		const user = await createFirstAdminUser({
			email: input.email,
			name: input.name,
			hashedPassword,
		});

		// null = a user already existed by the time the transaction ran.
		if (!user) {
			throw new ORPCError("FORBIDDEN");
		}

		return { ok: true as const };
	});
