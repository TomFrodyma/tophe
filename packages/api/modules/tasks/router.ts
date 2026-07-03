import { createTaskProcedure } from "./procedures/create-task";
import { deleteTaskProcedure } from "./procedures/delete-task";
import { listTasks } from "./procedures/list-tasks";
import { updateTaskProcedure } from "./procedures/update-task";

export const tasksRouter = {
	list: listTasks,
	create: createTaskProcedure,
	update: updateTaskProcedure,
	delete: deleteTaskProcedure,
};
