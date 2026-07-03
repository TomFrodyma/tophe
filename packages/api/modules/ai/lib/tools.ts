import { tool } from "@repo/ai";
import {
	getCareerProfileForUser,
	listCalendarEventsInRange,
	listCareerNextStepsForUser,
	listCareerRolesForUser,
	listCareerSkillsForUser,
	listGoalsForUser,
	listJournalEntriesForUser,
	listNotesForUser,
	listTasksForUser,
	listWishlistForUser,
	saveAgentMemory,
	searchAgentMemories,
} from "@repo/database";
import { z } from "zod";

import { expandEvents } from "../../calendar/lib/recurrence";

function truncate(s: string | null | undefined, n: number) {
	if (!s) return "";
	return s.length > n ? `${s.slice(0, n)}…` : s;
}

function dateOnly(d: Date) {
	return d.toISOString().slice(0, 10);
}

/**
 * Read-only tools the agent can call. userId is captured in this closure and is
 * NEVER a tool argument - the model cannot point a tool at another user's data.
 * Each tool bounds its result size (limits + truncation) so a single turn can't
 * dump the whole database into the model context - that bounding is the privacy
 * "data minimization" we rely on, and it keeps the bill sane.
 */
export function buildAgentTools(userId: string) {
	return {
		getJournal: tool({
			description:
				"Read the user's journal entries (most recent first). Optionally filter by a keyword search.",
			inputSchema: z.object({
				query: z.string().optional().describe("Optional keyword(s) to filter entries"),
				limit: z
					.number()
					.int()
					.min(1)
					.max(40)
					.optional()
					.describe("Max entries, default 15"),
			}),
			execute: async ({ query, limit }) => {
				const entries = await listJournalEntriesForUser(
					userId,
					limit ?? 15,
					query ? { search: query } : {},
				);
				return entries.map((e) => ({
					date: dateOnly(e.createdAt),
					title: e.title,
					mood: e.mood,
					content: truncate(e.content, 600),
				}));
			},
		}),

		getCalendar: tool({
			description:
				"Read the user's calendar as event occurrences within a window relative to today. Recurring events are expanded into their occurrences.",
			inputSchema: z.object({
				daysBack: z
					.number()
					.int()
					.min(0)
					.max(120)
					.optional()
					.describe("Days before today to include, default 1"),
				daysAhead: z
					.number()
					.int()
					.min(1)
					.max(180)
					.optional()
					.describe("Days after today to include, default 30"),
			}),
			execute: async ({ daysBack, daysAhead }) => {
				const now = new Date();
				const from = new Date(now);
				from.setDate(from.getDate() - (daysBack ?? 1));
				const to = new Date(now);
				to.setDate(to.getDate() + (daysAhead ?? 30));
				const rows = await listCalendarEventsInRange(userId, from, to);
				return expandEvents(rows, from, to)
					.slice(0, 80)
					.map((o) => ({
						title: o.title,
						start: o.startAt.toISOString(),
						end: o.endAt.toISOString(),
						allDay: o.allDay,
						location: o.location,
						recurring: o.isRecurring,
					}));
			},
		}),

		getCareer: tool({
			description:
				"Read the user's career: roles (with highlights and salary history), skills, their own written reflections, and saved next steps.",
			inputSchema: z.object({}),
			execute: async () => {
				const [roles, skills, profile, nextSteps] = await Promise.all([
					listCareerRolesForUser(userId),
					listCareerSkillsForUser(userId),
					getCareerProfileForUser(userId),
					listCareerNextStepsForUser(userId),
				]);
				return {
					roles: roles.map((r) => ({
						company: r.company,
						title: r.title,
						kind: r.kind,
						start: dateOnly(r.startDate),
						end: r.endDate ? dateOnly(r.endDate) : null,
						summary: truncate(r.summary, 400),
						highlights: r.highlights.map((h) => h.text),
						salaries: r.salaries.map((s) => ({
							date: dateOnly(s.effectiveDate),
							amount: s.amount.toString(),
							currency: s.currency,
							basis: s.basis,
							period: s.period,
						})),
					})),
					skills: skills.map((s) => ({
						name: s.name,
						category: s.category,
						level: s.level,
					})),
					reflections: truncate(profile?.reflections, 1500),
					nextSteps: nextSteps.map((n) => ({
						text: n.text,
						timeframe: n.timeframe,
						done: n.done,
					})),
				};
			},
		}),

		getGoals: tool({
			description:
				"Read the user's goals with progress and milestones. Optionally filter by status.",
			inputSchema: z.object({
				status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ARCHIVED"]).optional(),
			}),
			execute: async ({ status }) => {
				const goals = await listGoalsForUser(userId, 100, status ? { status } : {});
				return goals.map((g) => ({
					title: g.title,
					status: g.status,
					horizon: g.horizon,
					type: g.type,
					current: g.currentValue,
					target: g.targetValue,
					unit: g.unit,
					due: g.dueDate ? dateOnly(g.dueDate) : null,
					milestones: g.milestones.map((m) => ({ title: m.title, done: m.done })),
				}));
			},
		}),

		getTasks: tool({
			description: "Read the user's tasks. Optionally filter by status (OPEN or DONE).",
			inputSchema: z.object({
				status: z.enum(["OPEN", "DONE"]).optional(),
			}),
			execute: async ({ status }) => {
				const tasks = await listTasksForUser(userId, 200, status ? { status } : {});
				return tasks.map((t) => ({
					title: t.title,
					status: t.status,
					due: t.dueDate ? dateOnly(t.dueDate) : null,
					notes: truncate(t.notes, 300),
				}));
			},
		}),

		getNotes: tool({
			description:
				"Read the user's notes (most recent first). Optionally filter by a keyword search.",
			inputSchema: z.object({
				query: z.string().optional().describe("Optional keyword(s) to filter notes"),
				limit: z.number().int().min(1).max(40).optional().describe("Max notes, default 20"),
			}),
			execute: async ({ query, limit }) => {
				const notes = await listNotesForUser(
					userId,
					limit ?? 20,
					query ? { search: query } : {},
				);
				return notes.map((n) => ({
					title: n.title,
					content: truncate(n.content, 600),
					remindAt: n.remindAt ? n.remindAt.toISOString() : null,
					updated: dateOnly(n.updatedAt),
				}));
			},
		}),

		getWishlist: tool({
			description: "Read the user's wishlist. Optionally filter by status (WANTED or PURCHASED).",
			inputSchema: z.object({
				status: z.enum(["WANTED", "PURCHASED"]).optional(),
			}),
			execute: async ({ status }) => {
				const items = await listWishlistForUser(userId, 200, status ? { status } : {});
				return items.map((w) => ({
					title: w.title,
					priority: w.priority,
					status: w.status,
					price: w.price,
					currency: w.currency,
					url: w.url,
					notes: truncate(w.notes, 200),
				}));
			},
		}),

		recallMemories: tool({
			description:
				"Search your saved memories about the user by keyword. Use this before assuming things or answering from scratch.",
			inputSchema: z.object({
				query: z.string().describe("What you want to recall about the user"),
			}),
			execute: async ({ query }) => {
				const mems = await searchAgentMemories(userId, query, 12);
				return mems.map((m) => ({ remembered: dateOnly(m.createdAt), note: m.content }));
			},
		}),

		saveMemory: tool({
			description:
				"Save a durable fact, preference, or decision about the user so you remember it in future conversations. One concise sentence. Don't save trivia or small talk.",
			inputSchema: z.object({
				content: z
					.string()
					.min(3)
					.max(500)
					.describe("The thing to remember, in one sentence"),
			}),
			execute: async ({ content }) => {
				await saveAgentMemory(userId, content, "AGENT");
				return { saved: true };
			},
		}),
	};
}
