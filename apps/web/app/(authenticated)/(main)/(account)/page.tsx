import { getSession } from "@auth/lib/server";
import { AgentGreeting } from "@shared/components/AgentGreeting";
import { ModuleGrid } from "@shared/components/ModuleGrid";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("start");

	const firstName =
		session.user.name?.split(" ")[0] ?? session.user.name ?? "";

	return (
		<div className="flex flex-col gap-10 md:min-h-full md:justify-center">
			{/* Hero: the agent's personal, time/weather/date/holiday-aware greeting. */}
			<header className="rounded-block flex flex-col justify-between gap-10 bg-paper-hero p-10 text-paper-hero-ink md:min-h-[280px] md:p-12">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
					{t("eyebrow")}
				</p>
				<AgentGreeting name={firstName} loadingNote={t("welcomeSecond")} />
			</header>

			<section className="flex flex-col gap-5">
				<div className="flex items-baseline justify-between gap-6 px-2">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink/60">
						{t("modules.title")}
					</p>
				</div>
				<ModuleGrid />
			</section>
		</div>
	);
}
