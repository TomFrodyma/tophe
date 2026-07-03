import { ORPCError } from "@orpc/server";
import { generateObject, taskModel } from "@repo/ai";
import {
	getCareerProfileForUser,
	listCareerRolesForUser,
	listCareerSkillsForUser,
	saveCareerInsights,
} from "@repo/database";
import { logger } from "@repo/logs";

import { protectedProcedure } from "../../../orpc/procedures";
import { type CareerInsights, careerInsightsSchema } from "../insights";

function formatDate(d: Date) {
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export const generateInsights = protectedProcedure
	.route({
		method: "POST",
		path: "/career/insights/generate",
		tags: ["Career"],
		summary: "Generate AI career insights and suggested next steps",
	})
	.handler(async ({ context: { user } }) => {
		const [roles, skills, profile] = await Promise.all([
			listCareerRolesForUser(user.id),
			listCareerSkillsForUser(user.id),
			getCareerProfileForUser(user.id),
		]);

		if (roles.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Add at least one role before generating insights.",
			});
		}

		const rolesText = roles
			.map((r) => {
				const end = r.endDate ? formatDate(r.endDate) : "present";
				const highlights = r.highlights
					.map((h) => `    - ${h.text}${h.metric ? ` (${h.metric})` : ""}`)
					.join("\n");
				const salaries = r.salaries
					.map(
						(s) =>
							`    - ${formatDate(s.effectiveDate)}: ${s.amount.toString()} ${s.currency} ${s.basis}/${s.period}${s.label ? ` (${s.label})` : ""}`,
					)
					.join("\n");
				return [
					`### ${r.title} - ${r.company} (${formatDate(r.startDate)} – ${end})`,
					r.location ? `Location: ${r.location}` : null,
					r.summary ? r.summary.trim() : null,
					highlights ? `Highlights:\n${highlights}` : null,
					salaries ? `Salary:\n${salaries}` : null,
				]
					.filter(Boolean)
					.join("\n");
			})
			.join("\n\n");

		const skillsByCategory = new Map<string, string[]>();
		for (const s of skills) {
			const list = skillsByCategory.get(s.category) ?? [];
			list.push(s.level ? `${s.name} (${s.level})` : s.name);
			skillsByCategory.set(s.category, list);
		}
		const skillsText =
			[...skillsByCategory.entries()]
				.map(([cat, items]) => `- ${cat}: ${items.join(", ")}`)
				.join("\n") || "None recorded.";

		let object: CareerInsights;
		try {
			({ object } = await generateObject({
				model: await taskModel(process.env.ANTHROPIC_CLAUDE_MODEL_ID ?? "claude-opus-4-8"),
				// Headroom for the full structured object: a verbose history can push the
				// JSON past a tighter cap, and a truncated response fails schema parsing.
				maxOutputTokens: 4000,
				schema: careerInsightsSchema,
				system:
					"You are a sharp, honest career strategist. You read someone's real career " +
					"history - roles, achievements, salary progression, and skills - and produce " +
					"grounded, specific guidance. Be concrete and reference their actual experience. " +
					"Do not invent facts. Avoid generic advice; favor logical, evidence-based next " +
					"steps that build on momentum already visible in the history. Write in the second " +
					"person ('you').",
				prompt:
					`Analyze my career and suggest logical next steps.\n\n` +
					`## Roles (newest first)\n${rolesText}\n\n` +
					`## Skills\n${skillsText}\n\n` +
					(profile?.reflections
						? `## My own reflections\n${profile.reflections.trim()}\n\n`
						: "") +
					`Consider the salary trajectory, the shift from sales toward product/building, ` +
					`and where the most leverage is for the next move.`,
			}));
		} catch (error) {
			logger.error("Career insights generation failed", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "The AI couldn't generate insights this time. Please try again.",
			});
		}

		await saveCareerInsights(user.id, JSON.stringify(object));

		return object;
	});
