import { createCareerNextStep } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeNextStep } from "../serialize";
import { nextStepInputSchema } from "../types";

export const createNextStep = protectedProcedure
	.route({
		method: "POST",
		path: "/career/next-steps",
		tags: ["Career"],
		summary: "Create a career next step",
	})
	.input(nextStepInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const step = await createCareerNextStep(user.id, input);
		return serializeNextStep(step);
	});
