import { checkInGoal } from "./procedures/check-in";
import { createGoalProcedure } from "./procedures/create-goal";
import { deleteCheckIn } from "./procedures/delete-check-in";
import { deleteGoalProcedure } from "./procedures/delete-goal";
import { getGoal } from "./procedures/get-goal";
import { listGoals } from "./procedures/list-goals";
import { reorderGoalsProcedure } from "./procedures/reorder-goals";
import { toggleMilestone } from "./procedures/toggle-milestone";
import { updateGoalProcedure } from "./procedures/update-goal";

export const goalsRouter = {
	list: listGoals,
	get: getGoal,
	create: createGoalProcedure,
	update: updateGoalProcedure,
	reorder: reorderGoalsProcedure,
	delete: deleteGoalProcedure,
	checkIn: checkInGoal,
	deleteCheckIn,
	toggleMilestone,
};
