import { createEvent } from "./procedures/create-event";
import { deleteEvent } from "./procedures/delete-event";
import { deleteIntegration } from "./procedures/delete-integration";
import { getEvent } from "./procedures/get-event";
import { getIntegration } from "./procedures/get-integration";
import { listEvents } from "./procedures/list-events";
import { syncIntegration } from "./procedures/sync-integration";
import { updateEvent } from "./procedures/update-event";
import { upsertIntegration } from "./procedures/upsert-integration";

export const calendarRouter = {
	list: listEvents,
	get: getEvent,
	create: createEvent,
	update: updateEvent,
	delete: deleteEvent,
	integrations: {
		get: getIntegration,
		upsert: upsertIntegration,
		delete: deleteIntegration,
		sync: syncIntegration,
	},
};
