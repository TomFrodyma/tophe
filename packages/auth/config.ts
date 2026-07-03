import type { AuthConfig } from "./types";

export const config = {
	enableSignup: false,
	enableMagicLink: false,
	enableSocialLogin: false,
	enablePasskeys: false,
	enablePasswordLogin: true,
	enableTwoFactor: true,
	sessionCookieMaxAge: 60 * 60 * 24 * 30,
	users: {
		enableOnboarding: true,
	},
} as const satisfies AuthConfig;
