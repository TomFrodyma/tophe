import { createNoteProcedure } from "./procedures/create-note";
import { deleteNoteProcedure } from "./procedures/delete-note";
import { getNote } from "./procedures/get-note";
import { listNotes } from "./procedures/list-notes";
import { reorderNotesProcedure } from "./procedures/reorder-notes";
import { updateNoteProcedure } from "./procedures/update-note";

export const notesRouter = {
	list: listNotes,
	get: getNote,
	create: createNoteProcedure,
	update: updateNoteProcedure,
	reorder: reorderNotesProcedure,
	delete: deleteNoteProcedure,
};
