import type { RouterClient } from "@orpc/server";

import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { calendarRouter } from "../modules/calendar/router";
import { careerRouter } from "../modules/career/router";
import { goalsRouter } from "../modules/goals/router";
import { journalRouter } from "../modules/journal/router";
import { notesRouter } from "../modules/notes/router";
import { notificationsRouter } from "../modules/notifications/router";
import { tasksRouter } from "../modules/tasks/router";
import { usersRouter } from "../modules/users/router";
import { wishlistRouter } from "../modules/wishlist/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	users: usersRouter,
	ai: aiRouter,
	notifications: notificationsRouter,
	journal: journalRouter,
	calendar: calendarRouter,
	career: careerRouter,
	goals: goalsRouter,
	tasks: tasksRouter,
	notes: notesRouter,
	wishlist: wishlistRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;
