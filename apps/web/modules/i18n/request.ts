import { getSession } from "@auth/lib/server";
import { config as i18nConfig } from "@repo/i18n";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { getMessagesForLocale } from "./lib/messages";

export default getRequestConfig(async ({ requestLocale }) => {
	let locale = await requestLocale;

	if (!locale) {
		const cookieStore = await cookies();
		const localeCookie = cookieStore.get(i18nConfig.localeCookieName);
		locale = localeCookie?.value ?? i18nConfig.defaultLocale;
	}

	if (!(locale in i18nConfig.locales)) {
		locale = i18nConfig.defaultLocale;
	}

	let timeZone: string | undefined;
	try {
		const session = await getSession();
		const user = session?.user as { timezone?: string | null } | undefined;
		if (user?.timezone) {
			timeZone = user.timezone;
		}
	} catch {
		// ignore - unauthenticated routes or missing session
	}

	return {
		locale,
		messages: await getMessagesForLocale(locale),
		...(timeZone ? { timeZone } : {}),
	};
});
