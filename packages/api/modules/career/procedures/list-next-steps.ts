import { listCareerNextStepsForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeNextStep } from "../serialize";

export const listNextSteps = protectedProcedure
	.route({
		method: "GET",
		path: "/career/next-steps",
		tags: ["Career"],
		summary: "List career next steps",
	})
	.handler(async ({ context: { user } }) => {
		const steps = await listCareerNextStepsForUser(user.id);
		return steps.map(serializeNextStep);
	});
