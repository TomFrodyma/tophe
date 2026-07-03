import { bootstrapFirstUser } from "./procedures/bootstrap-first-user";
import { createAvatarUploadUrl } from "./procedures/create-avatar-upload-url";
import { getPinnedModules } from "./procedures/get-pinned-modules";
import { setPinnedModules } from "./procedures/set-pinned-modules";

export const usersRouter = {
	avatarUploadUrl: createAvatarUploadUrl,
	bootstrap: bootstrapFirstUser,
	getPinnedModules,
	setPinnedModules,
};
