import { db } from "../client";
import { Prisma } from "../generated/client";
import type { CareerRoleKind, SalaryBasis, SalaryPeriod, SkillLevel } from "../generated/client";

export interface SalarySeed {
	effectiveDate: Date;
	amount: string | number;
	currency?: string;
	basis?: SalaryBasis;
	period?: SalaryPeriod;
	label?: string | null;
}

export interface HighlightSeed {
	text: string;
	metric?: string | null;
	sortIndex?: number;
}

export interface CareerRoleInput {
	company: string;
	title: string;
	kind?: CareerRoleKind;
	location?: string | null;
	startDate: Date;
	endDate?: Date | null;
	summary?: string | null;
	color?: string;
	icon?: string | null;
	sortIndex?: number;
	highlights?: HighlightSeed[];
	salaries?: SalarySeed[];
}

export interface CareerSkillInput {
	name: string;
	category: string;
	level?: SkillLevel | null;
	sortIndex?: number;
}

export interface CareerNextStepInput {
	text: string;
	detail?: string | null;
	timeframe?: string | null;
	source?: string;
	sortIndex?: number;
}

const roleInclude = {
	highlights: { orderBy: { sortIndex: "asc" } },
	salaries: { orderBy: { effectiveDate: "asc" } },
} satisfies Prisma.CareerRoleInclude;

// ----- Roles -----

export async function listCareerRolesForUser(userId: string) {
	return await db.careerRole.findMany({
		where: { userId },
		include: roleInclude,
		orderBy: [{ startDate: "desc" }, { sortIndex: "desc" }],
	});
}

export async function getCareerRoleForUser(id: string, userId: string) {
	return await db.careerRole.findFirst({
		where: { id, userId },
		include: roleInclude,
	});
}

export async function createCareerRole(userId: string, input: CareerRoleInput) {
	return await db.careerRole.create({
		data: {
			userId,
			company: input.company,
			title: input.title,
			kind: input.kind ?? "EMPLOYMENT",
			location: input.location ?? null,
			startDate: input.startDate,
			endDate: input.endDate ?? null,
			summary: input.summary ?? null,
			color: input.color ?? "sky",
			icon: input.icon ?? null,
			sortIndex: input.sortIndex ?? 0,
			highlights: {
				create: (input.highlights ?? []).map((h, i) => ({
					userId,
					text: h.text,
					metric: h.metric ?? null,
					sortIndex: h.sortIndex ?? i,
				})),
			},
			salaries: {
				create: (input.salaries ?? []).map((s) => ({
					userId,
					effectiveDate: s.effectiveDate,
					amount: new Prisma.Decimal(s.amount),
					currency: s.currency ?? "EUR",
					basis: s.basis ?? "NET",
					period: s.period ?? "MONTHLY",
					label: s.label ?? null,
				})),
			},
		},
		include: roleInclude,
	});
}

/**
 * Replace a role and its child highlights/salaries in a single transaction.
 * Children are fully rewritten from the input, mirroring how the form submits them.
 */
export async function updateCareerRole(id: string, userId: string, input: CareerRoleInput) {
	const owned = await db.careerRole.findFirst({
		where: { id, userId },
		select: { id: true },
	});
	if (!owned) return null;

	return await db.$transaction(async (tx) => {
		await tx.careerHighlight.deleteMany({ where: { roleId: id } });
		await tx.careerSalary.deleteMany({ where: { roleId: id } });
		return await tx.careerRole.update({
			where: { id },
			data: {
				company: input.company,
				title: input.title,
				kind: input.kind ?? "EMPLOYMENT",
				location: input.location ?? null,
				startDate: input.startDate,
				endDate: input.endDate ?? null,
				summary: input.summary ?? null,
				color: input.color ?? "sky",
				icon: input.icon ?? null,
				sortIndex: input.sortIndex ?? 0,
				highlights: {
					create: (input.highlights ?? []).map((h, i) => ({
						userId,
						text: h.text,
						metric: h.metric ?? null,
						sortIndex: h.sortIndex ?? i,
					})),
				},
				salaries: {
					create: (input.salaries ?? []).map((s) => ({
						userId,
						effectiveDate: s.effectiveDate,
						amount: new Prisma.Decimal(s.amount),
						currency: s.currency ?? "EUR",
						basis: s.basis ?? "NET",
						period: s.period ?? "MONTHLY",
						label: s.label ?? null,
					})),
				},
			},
			include: roleInclude,
		});
	});
}

export async function deleteCareerRoleForUser(id: string, userId: string) {
	const result = await db.careerRole.deleteMany({ where: { id, userId } });
	return result.count;
}

// ----- Skills -----

export async function listCareerSkillsForUser(userId: string) {
	return await db.careerSkill.findMany({
		where: { userId },
		orderBy: [{ category: "asc" }, { sortIndex: "asc" }, { name: "asc" }],
	});
}

export async function createCareerSkill(userId: string, input: CareerSkillInput) {
	return await db.careerSkill.create({
		data: {
			userId,
			name: input.name,
			category: input.category,
			level: input.level ?? null,
			sortIndex: input.sortIndex ?? 0,
		},
	});
}

export async function updateCareerSkill(
	id: string,
	userId: string,
	input: Partial<CareerSkillInput>,
) {
	const result = await db.careerSkill.updateMany({
		where: { id, userId },
		data: {
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.category !== undefined ? { category: input.category } : {}),
			...(input.level !== undefined ? { level: input.level } : {}),
			...(input.sortIndex !== undefined ? { sortIndex: input.sortIndex } : {}),
		},
	});
	return result.count;
}

export async function deleteCareerSkillForUser(id: string, userId: string) {
	const result = await db.careerSkill.deleteMany({ where: { id, userId } });
	return result.count;
}

// ----- Next steps -----

export async function listCareerNextStepsForUser(userId: string) {
	return await db.careerNextStep.findMany({
		where: { userId },
		orderBy: [{ done: "asc" }, { sortIndex: "asc" }, { createdAt: "desc" }],
	});
}

export async function createCareerNextStep(userId: string, input: CareerNextStepInput) {
	return await db.careerNextStep.create({
		data: {
			userId,
			text: input.text,
			detail: input.detail ?? null,
			timeframe: input.timeframe ?? null,
			source: input.source ?? "MANUAL",
			sortIndex: input.sortIndex ?? 0,
		},
	});
}

export async function updateCareerNextStep(
	id: string,
	userId: string,
	input: {
		text?: string;
		detail?: string | null;
		timeframe?: string | null;
		done?: boolean;
		sortIndex?: number;
	},
) {
	const result = await db.careerNextStep.updateMany({
		where: { id, userId },
		data: {
			...(input.text !== undefined ? { text: input.text } : {}),
			...(input.detail !== undefined ? { detail: input.detail } : {}),
			...(input.timeframe !== undefined ? { timeframe: input.timeframe } : {}),
			...(input.done !== undefined
				? { done: input.done, doneAt: input.done ? new Date() : null }
				: {}),
			...(input.sortIndex !== undefined ? { sortIndex: input.sortIndex } : {}),
		},
	});
	return result.count;
}

export async function deleteCareerNextStepForUser(id: string, userId: string) {
	const result = await db.careerNextStep.deleteMany({ where: { id, userId } });
	return result.count;
}

// ----- Profile (reflections + cached AI insights) -----

export async function getCareerProfileForUser(userId: string) {
	return await db.careerProfile.findUnique({ where: { userId } });
}

export async function saveCareerReflections(userId: string, reflections: string) {
	return await db.careerProfile.upsert({
		where: { userId },
		create: { userId, reflections },
		update: { reflections },
	});
}

export async function saveCareerInsights(userId: string, insightsJson: string) {
	return await db.careerProfile.upsert({
		where: { userId },
		create: { userId, insightsJson, insightsGeneratedAt: new Date() },
		update: { insightsJson, insightsGeneratedAt: new Date() },
	});
}
