import { listUsers } from "./procedures/list-users";

export const adminRouter = {
	users: {
		list: listUsers,
	},
};
