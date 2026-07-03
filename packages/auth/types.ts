export interface AuthUserConfig {
	/**
	 * Enables the post-signup onboarding flow before a new user reaches the main
	 * application.
	 */
	enableOnboarding: boolean;
}

export interface AuthConfig {
	/**
	 * Enables self-serve account creation across the authentication flows.
	 */
	enableSignup: boolean;
	/**
	 * Enables passwordless sign-in links delivered by email.
	 */
	enableMagicLink: boolean;
	/**
	 * Enables configured third-party OAuth providers in the sign-in UI.
	 */
	enableSocialLogin: boolean;
	/**
	 * Enables passkey registration and sign-in support.
	 */
	enablePasskeys: boolean;
	/**
	 * Enables classic email and password authentication flows.
	 */
	enablePasswordLogin: boolean;
	/**
	 * Enables two-factor authentication enrollment and verification.
	 */
	enableTwoFactor: boolean;
	/**
	 * Session cookie lifetime, expressed in seconds.
	 */
	sessionCookieMaxAge: number;
	/**
	 * User-specific feature flags for onboarding and account setup behavior.
	 */
	users: AuthUserConfig;
}
