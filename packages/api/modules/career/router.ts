import { createNextStep } from "./procedures/create-next-step";
import { createRole } from "./procedures/create-role";
import { createSkill } from "./procedures/create-skill";
import { deleteNextStep } from "./procedures/delete-next-step";
import { deleteRole } from "./procedures/delete-role";
import { deleteSkill } from "./procedures/delete-skill";
import { generateInsights } from "./procedures/generate-insights";
import { getProfile } from "./procedures/get-profile";
import { getRole } from "./procedures/get-role";
import { listNextSteps } from "./procedures/list-next-steps";
import { listRoles } from "./procedures/list-roles";
import { listSkills } from "./procedures/list-skills";
import { saveReflections } from "./procedures/save-reflections";
import { updateNextStep } from "./procedures/update-next-step";
import { updateRole } from "./procedures/update-role";
import { updateSkill } from "./procedures/update-skill";

export const careerRouter = {
	roles: {
		list: listRoles,
		get: getRole,
		create: createRole,
		update: updateRole,
		delete: deleteRole,
	},
	skills: {
		list: listSkills,
		create: createSkill,
		update: updateSkill,
		delete: deleteSkill,
	},
	nextSteps: {
		list: listNextSteps,
		create: createNextStep,
		update: updateNextStep,
		delete: deleteNextStep,
	},
	profile: {
		get: getProfile,
		saveReflections,
	},
	insights: {
		generate: generateInsights,
	},
};
