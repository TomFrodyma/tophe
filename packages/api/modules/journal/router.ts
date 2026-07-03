import { createEntry } from "./procedures/create-entry";
import { deleteEntry } from "./procedures/delete-entry";
import { getEntry } from "./procedures/get-entry";
import { listEntries } from "./procedures/list-entries";
import { summarize } from "./procedures/summarize";
import { updateEntry } from "./procedures/update-entry";
import { upsertToday } from "./procedures/upsert-today";

export const journalRouter = {
	list: listEntries,
	get: getEntry,
	create: createEntry,
	update: updateEntry,
	delete: deleteEntry,
	upsertToday,
	summarize,
};
