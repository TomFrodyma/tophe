import type {
	CareerHighlight,
	CareerNextStep,
	CareerRole,
	CareerSalary,
	CareerSkill,
} from "@repo/database";

type RoleWithChildren = CareerRole & {
	highlights: CareerHighlight[];
	salaries: CareerSalary[];
};

export function serializeSalary(s: CareerSalary) {
	return {
		id: s.id,
		roleId: s.roleId,
		effectiveDate: s.effectiveDate.toISOString(),
		amount: s.amount.toString(),
		currency: s.currency,
		basis: s.basis,
		period: s.period,
		label: s.label,
	};
}

export function serializeHighlight(h: CareerHighlight) {
	return {
		id: h.id,
		text: h.text,
		metric: h.metric,
		sortIndex: h.sortIndex,
	};
}

export function serializeRole(role: RoleWithChildren) {
	return {
		id: role.id,
		company: role.company,
		title: role.title,
		kind: role.kind,
		location: role.location,
		startDate: role.startDate.toISOString(),
		endDate: role.endDate ? role.endDate.toISOString() : null,
		summary: role.summary,
		color: role.color,
		icon: role.icon,
		sortIndex: role.sortIndex,
		createdAt: role.createdAt.toISOString(),
		highlights: role.highlights.map(serializeHighlight),
		salaries: role.salaries.map(serializeSalary),
	};
}

export function serializeSkill(s: CareerSkill) {
	return {
		id: s.id,
		name: s.name,
		category: s.category,
		level: s.level,
		sortIndex: s.sortIndex,
	};
}

export function serializeNextStep(n: CareerNextStep) {
	return {
		id: n.id,
		text: n.text,
		detail: n.detail,
		timeframe: n.timeframe,
		source: n.source,
		done: n.done,
		doneAt: n.doneAt ? n.doneAt.toISOString() : null,
		sortIndex: n.sortIndex,
	};
}
