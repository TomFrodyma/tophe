import { getSession } from "@auth/lib/server";
import { config as authConfig } from "@repo/auth/config";
import { ensureJournalDailyReminder } from "@repo/notifications";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function MainLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (authConfig.users.enableOnboarding && !session.user.onboardingComplete) {
		redirect("/onboarding");
	}

	await ensureJournalDailyReminder({ userId: session.user.id }).catch(() => {});

	return children;
}
