import { getSession } from "@auth/lib/server";
import { AiInsightsPanel } from "@career/components/AiInsightsPanel";
import { CareerOverview } from "@career/components/CareerOverview";
import { CareerSalaryChart } from "@career/components/CareerSalaryChart";
import { CareerTimeline } from "@career/components/CareerTimeline";
import { NextStepsList } from "@career/components/NextStepsList";
import { ReflectionsPanel } from "@career/components/ReflectionsPanel";
import { SkillsSection } from "@career/components/SkillsSection";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("career");
	return { title: t("title") };
}

export default async function CareerPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("career");

	return (
		<>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					<Button asChild>
						<Link href="/career/roles/new">
							<PlusIcon className="size-4" />
							{t("timeline.addRole")}
						</Link>
					</Button>
				}
			/>

			<div className="gap-6 flex flex-col">
				<CareerOverview />
				<div className="gap-6 lg:grid-cols-3 grid grid-cols-1">
					<div className="gap-8 lg:col-span-2 flex flex-col">
						<CareerSalaryChart />
						<CareerTimeline />
					</div>
					<aside className="gap-6 flex flex-col">
						<AiInsightsPanel />
						<NextStepsList />
						<ReflectionsPanel />
						<SkillsSection />
					</aside>
				</div>
			</div>
		</>
	);
}
